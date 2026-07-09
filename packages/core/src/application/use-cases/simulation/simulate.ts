import { RT } from "@inkvision/shared";
import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import type { OrderStatus } from "../../../domain/order-state-machine";
import { requestSimulationSchema, type RequestSimulationInput } from "../../dtos/simulation.dto";
import { advance, type SimulationUseCaseDeps } from "./deps";

const SIMULATABLE: OrderStatus[] = ["DESIGN_APPROVED", "AWAITING_BODY_PHOTO", "SIMULATION_REVIEW"];

/**
 * Cliente envia a foto do corpo e solicita a simulação. Cria o job (QUEUED),
 * leva o pedido a SIMULATING e enfileira o processamento (worker/in-process).
 */
export class RequestSimulationUseCase {
  constructor(private readonly deps: SimulationUseCaseDeps) {}

  async execute(
    actor: Actor | null,
    orderId: string,
    rawInput: RequestSimulationInput,
  ): Promise<{ simulationId: string }> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (!SIMULATABLE.includes(order.status)) {
      throw new ValidationError("A arte precisa estar aprovada antes de simular.");
    }
    const design = await this.deps.designs.getLatestApproved(orderId);
    if (!design) throw new NotFoundError("Arte aprovada");

    const input = parseInput(requestSimulationSchema, rawInput);
    const sim = await this.deps.simulations.create({
      orderId,
      studioId: order.studioId,
      designVersionId: design.id,
      designUrl: design.imageUrl,
      bodyPhotoUrl: input.bodyPhotoUrl,
      composedImageUrl: input.composedImageUrl,
      composedMaskUrl: input.composedMaskUrl,
      placement: input.placement,
      provider: this.deps.provider.name,
    });

    // Leva a SIMULATING pelo caminho válido a partir do estado atual.
    const paths: Record<string, OrderStatus[]> = {
      DESIGN_APPROVED: ["DESIGN_APPROVED", "AWAITING_BODY_PHOTO", "SIMULATING"],
      AWAITING_BODY_PHOTO: ["AWAITING_BODY_PHOTO", "SIMULATING"],
      SIMULATION_REVIEW: ["SIMULATION_REVIEW", "AWAITING_BODY_PHOTO", "SIMULATING"],
    };
    await advance(this.deps.orders, orderId, order.studioId, actor.userId, paths[order.status]!);

    await this.deps.queue.enqueue(sim.id);
    return { simulationId: sim.id };
  }
}

/**
 * Processa o job de simulação (worker ou in-process). Idempotente: só age em
 * jobs QUEUED. Chama o provider de IA, salva as variantes, registra uso, leva o
 * pedido a SIMULATION_REVIEW e avisa o cliente em tempo real.
 */
export class ProcessSimulationUseCase {
  constructor(private readonly deps: SimulationUseCaseDeps) {}

  async execute(simulationId: string): Promise<void> {
    const sim = await this.deps.simulations.findById(simulationId);
    if (!sim || sim.status !== "QUEUED") return; // idempotente

    await this.deps.simulations.markProcessing(simulationId);
    const order = await this.deps.orders.findByIdForStudio(sim.orderId, sim.studioId);

    try {
      const result = await this.deps.provider.simulate({
        bodyPhotoUrl: sim.bodyPhotoUrl,
        designUrl: sim.designUrl,
        composedImageUrl: sim.composedImageUrl ?? undefined,
        composedMaskUrl: sim.composedMaskUrl ?? undefined,
        placement: sim.placement,
      });
      await this.deps.simulations.markDone(simulationId, result.variants, result.provider);
      await this.deps.aiUsage.log({
        studioId: sim.studioId,
        provider: result.provider,
        operation: "simulate",
        costCents: result.costCents,
      });

      if (order && order.status === "SIMULATING") {
        await this.deps.orders.transition(sim.orderId, sim.studioId, {
          from: "SIMULATING",
          to: "SIMULATION_REVIEW",
          actorId: order.clientId,
        });
      }
      if (order) {
        await this.deps.realtime.toUser(order.clientId, RT.SIMULATION_DONE, {
          orderId: sim.orderId,
          simulationId,
        });
        await this.deps.notifications.create({
          userId: order.clientId,
          type: "simulation.done",
          payload: { orderId: sim.orderId },
        });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha na simulação";
      await this.deps.simulations.markFailed(simulationId, message);
      if (order && order.status === "SIMULATING") {
        await this.deps.orders.transition(sim.orderId, sim.studioId, {
          from: "SIMULATING",
          to: "AWAITING_BODY_PHOTO",
          actorId: order.clientId,
          metadata: { error: message },
        });
        await this.deps.realtime.toUser(order.clientId, RT.SIMULATION_FAILED, {
          orderId: sim.orderId,
          simulationId,
        });
      }
      // Relança DEPOIS de já ter revertido o pedido e avisado o cliente: sem
      // isso, o BullMQ via apps/worker nunca via essa falha — o job era
      // reportado como "completed" mesmo quando a IA falhou de verdade, então
      // `worker.on("failed", ...)` nunca disparava e não havia NENHUM sinal
      // observável do lado da fila de que algo deu errado (achado de
      // auditoria: silêncio total até um cliente reclamar).
      throw e;
    }
  }
}

/** Cliente aprova a simulação → SIMULATION_APPROVED. */
export class ApproveSimulationUseCase {
  constructor(
    private readonly deps: Pick<SimulationUseCaseDeps, "orders" | "artists" | "notifications">,
  ) {}

  async execute(actor: Actor | null, orderId: string): Promise<void> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== "SIMULATION_REVIEW") {
      throw new ValidationError("Não há simulação aguardando aprovação.");
    }
    await this.deps.orders.transition(orderId, order.studioId, {
      from: "SIMULATION_REVIEW",
      to: "SIMULATION_APPROVED",
      actorId: actor.userId,
    });
    const artist = await this.deps.artists.findById(order.artistId);
    if (artist)
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "simulation.approved",
        payload: { orderId },
      });
  }
}
