import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { generateSlots } from "../../../domain/scheduling";
import type { ChatMessage, Conversation } from "../../ports/chat-repository";
import type { DesignRepository, DesignVersion } from "../../ports/design-repository";
import type { Order } from "../../ports/order-repository";
import type { Simulation, SimulationRepository } from "../../ports/simulation-repository";
import type { Appointment, ScheduleRepository } from "../../ports/schedule-repository";
import { SCHEDULE_HORIZON_DAYS, SESSION_MINUTES } from "../../ports/schedule-repository";
import type { Review, ReviewRepository } from "../../ports/review-repository";
import { resolveClientOrder, type ChatUseCaseDeps } from "../chat/deps";

/**
 * Deps do detalhe do pedido (lado do cliente). Reaproveita as deps de chat
 * (mesma checagem de dono via `resolveClientOrder`) e agrega os repos de
 * design/simulação/agenda/avaliação num único caso de uso.
 */
export interface GetClientOrderDetailDeps extends ChatUseCaseDeps {
  designs: Pick<DesignRepository, "getLatest">;
  simulations: Pick<SimulationRepository, "getLatestForOrder">;
  schedule: Pick<ScheduleRepository, "getAvailability" | "listBusy" | "getAppointmentForOrder">;
  reviews: Pick<ReviewRepository, "getForOrder">;
  /** Relógio injetável (testes passam um fixo). */
  now: () => Date;
}

export interface ClientOrderDetail {
  order: Order;
  conversation: Conversation;
  messages: ChatMessage[];
  latestDesign: DesignVersion | null;
  latestSimulation: Simulation | null;
  /** Horários disponíveis (só quando canBook); vazio caso contrário. */
  slots: Date[];
  appointment: Appointment | null;
  review: Review | null;
}

/** Estados em que a arte/simulação estão em andamento. */
const FLOW_STATUSES = [
  "DESIGN_REVIEW",
  "DESIGN_APPROVED",
  "AWAITING_BODY_PHOTO",
  "SIMULATING",
  "SIMULATION_REVIEW",
  "SIMULATION_APPROVED",
] as const;

/**
 * Agregador de leitura da página de detalhe do pedido (cliente). Autoriza UMA
 * vez (dono do pedido, via `resolveClientOrder`) e, reaproveitando o pedido já
 * carregado, busca só o que o status exige — evitando as ~6-8 idas ao banco que
 * a página fazia com casos de uso separados (inclusive o reload do pedido que o
 * `GetOrderSlotsUseCase` fazia).
 */
export class GetClientOrderDetailUseCase {
  constructor(private readonly deps: GetClientOrderDetailDeps) {}

  async execute(actor: Actor | null, orderId: string): Promise<ClientOrderDetail> {
    assertAuthenticated(actor);
    // Mesma checagem de dono + conversa do openClientConversation (lança NotFoundError).
    const { order, conversation } = await resolveClientOrder(this.deps, actor, orderId);
    const messages = await this.deps.chat.listMessages(conversation.id);

    const status = order.status;

    const inFlow = (FLOW_STATUSES as readonly string[]).includes(status);
    const [latestDesign, latestSimulation] = inFlow
      ? await Promise.all([
          this.deps.designs.getLatest(order.id),
          this.deps.simulations.getLatestForOrder(order.id),
        ])
      : [null, null];

    const canBook = status === "SIMULATION_APPROVED" || status === "SCHEDULED";
    const slots = canBook ? await this.loadSlots(order) : [];

    const appointment =
      status === "SCHEDULED"
        ? await this.deps.schedule.getAppointmentForOrder(order.studioId, order.id)
        : null;

    const canReview = status === "COMPLETED" || status === "REVIEWED";
    const review = canReview
      ? await this.deps.reviews.getForOrder(order.studioId, order.id)
      : null;

    return { order, conversation, messages, latestDesign, latestSimulation, slots, appointment, review };
  }

  /**
   * Gera os horários disponíveis reaproveitando o `order` já carregado — não
   * recarrega o pedido (o GetOrderSlotsUseCase recarregava). Mesma lógica:
   * getAvailability + listBusy (em paralelo) + domínio generateSlots.
   */
  private async loadSlots(order: Order): Promise<Date[]> {
    const now = this.deps.now();
    const to = new Date(now.getTime() + SCHEDULE_HORIZON_DAYS * 864e5);
    const [rules, busy] = await Promise.all([
      this.deps.schedule.getAvailability(order.artistId),
      this.deps.schedule.listBusy(order.studioId, order.artistId, now, to),
    ]);
    const generated = generateSlots({
      rules,
      busy,
      now,
      days: SCHEDULE_HORIZON_DAYS,
      slotMinutes: SESSION_MINUTES,
    });
    return generated.map((s) => s.startsAt);
  }
}
