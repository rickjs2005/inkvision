import { parseInput } from "../../validate";
import { type Actor } from "../../../domain/actor";
import { NotFoundError, ValidationError } from "../../../domain/errors";
import type { OrderStatus } from "../../../domain/order-state-machine";
import {
  reviewDesignSchema,
  sendDesignSchema,
  type ReviewDesignInput,
  type SendDesignInput,
} from "../../dtos/simulation.dto";
import type { DesignVersion } from "../../ports/design-repository";
import { assertStudioSide } from "../order/deps";
import { advance, type SimulationUseCaseDeps } from "./deps";

const DESIGNABLE: OrderStatus[] = ["DEPOSIT_PAID", "IN_DESIGN", "DESIGN_REVIEW", "CHANGES_REQUESTED"];

/** Tatuador envia uma versão de arte → pedido em DESIGN_REVIEW. */
export class SendDesignUseCase {
  constructor(
    private readonly deps: Pick<
      SimulationUseCaseDeps,
      "orders" | "designs" | "notifications" | "artists"
    >,
  ) {}

  async execute(
    actor: Actor,
    studioId: string,
    orderId: string,
    rawInput: SendDesignInput,
  ): Promise<DesignVersion> {
    const order = await this.deps.orders.findByIdForStudio(orderId, studioId);
    if (!order) throw new NotFoundError("Pedido");
    // Só o tatuador designado no pedido ou manager+/admin — não qualquer
    // membro do estúdio (achado de pentest: um ARTIST comum conseguia enviar
    // arte e avançar o estado de pedidos de OUTROS artistas do mesmo estúdio).
    const artist = await this.deps.artists.findById(order.artistId);
    assertStudioSide(actor, order, artist);
    if (!DESIGNABLE.includes(order.status)) {
      throw new ValidationError("O pedido não está na fase de arte.");
    }

    const input = parseInput(sendDesignSchema, rawInput);
    const design = await this.deps.designs.create(orderId, input.imageUrl, input.notes ?? null);

    // Leva o pedido até DESIGN_REVIEW pelo caminho válido.
    if (order.status === "DEPOSIT_PAID") {
      await advance(this.deps.orders, orderId, studioId, actor.userId, [
        "DEPOSIT_PAID",
        "IN_DESIGN",
        "DESIGN_REVIEW",
      ]);
    } else if (order.status === "CHANGES_REQUESTED") {
      await advance(this.deps.orders, orderId, studioId, actor.userId, [
        "CHANGES_REQUESTED",
        "IN_DESIGN",
        "DESIGN_REVIEW",
      ]);
    } else if (order.status === "IN_DESIGN") {
      await advance(this.deps.orders, orderId, studioId, actor.userId, ["IN_DESIGN", "DESIGN_REVIEW"]);
    }
    // Se já está DESIGN_REVIEW, apenas adiciona nova versão.

    await this.deps.notifications.create({
      userId: order.clientId,
      type: "design.sent",
      payload: { orderId },
    });
    return design;
  }
}

/** Cliente aprova a arte ou solicita alterações. */
export class ReviewDesignUseCase {
  constructor(
    private readonly deps: Pick<
      SimulationUseCaseDeps,
      "orders" | "designs" | "artists" | "notifications"
    >,
  ) {}

  async execute(actor: Actor, orderId: string, rawInput: ReviewDesignInput): Promise<void> {
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== "DESIGN_REVIEW") {
      throw new ValidationError("Não há arte aguardando aprovação.");
    }
    const input = parseInput(reviewDesignSchema, rawInput);
    const latest = await this.deps.designs.getLatest(orderId);
    if (!latest) throw new NotFoundError("Arte");

    const artist = await this.deps.artists.findById(order.artistId);

    if (input.approve) {
      await this.deps.designs.setStatus(latest.id, "APPROVED", null);
      await this.deps.orders.transition(orderId, order.studioId, {
        from: "DESIGN_REVIEW",
        to: "DESIGN_APPROVED",
        actorId: actor.userId,
      });
      if (artist)
        await this.deps.notifications.create({ userId: artist.userId, type: "design.approved", payload: { orderId } });
    } else {
      await this.deps.designs.setStatus(latest.id, "CHANGES_REQUESTED", input.feedback ?? null);
      await this.deps.orders.transition(orderId, order.studioId, {
        from: "DESIGN_REVIEW",
        to: "CHANGES_REQUESTED",
        actorId: actor.userId,
        metadata: { feedback: input.feedback },
      });
      if (artist)
        await this.deps.notifications.create({ userId: artist.userId, type: "design.changes", payload: { orderId } });
    }
  }
}
