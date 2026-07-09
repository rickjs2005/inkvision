import { ValidationError } from "./errors";

export type OrderStatus =
  | "SUBMITTED"
  | "QUOTED"
  | "DEPOSIT_PENDING"
  | "DEPOSIT_PAID"
  | "IN_DESIGN"
  | "DESIGN_REVIEW"
  | "CHANGES_REQUESTED"
  | "DESIGN_APPROVED"
  | "AWAITING_BODY_PHOTO"
  | "SIMULATING"
  | "SIMULATION_REVIEW"
  | "SIMULATION_APPROVED"
  | "SCHEDULED"
  | "SESSION_DONE"
  | "COMPLETED"
  | "REVIEWED"
  | "CANCELLED"
  | "REFUNDED";

/**
 * Transições válidas do pedido (grafo completo — ver docs/ARCHITECTURE.md §4.1).
 * A máquina valida apenas a validade de estado; a autorização (quem pode) fica
 * nos casos de uso, que conhecem os papéis do actor no pedido.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  SUBMITTED: ["QUOTED", "CANCELLED"],
  QUOTED: ["DEPOSIT_PENDING", "QUOTED", "CANCELLED"], // re-orçamento mantém QUOTED
  DEPOSIT_PENDING: ["DEPOSIT_PAID", "CANCELLED"],
  DEPOSIT_PAID: ["IN_DESIGN", "REFUNDED"],
  IN_DESIGN: ["DESIGN_REVIEW", "CANCELLED"],
  DESIGN_REVIEW: ["DESIGN_APPROVED", "CHANGES_REQUESTED"],
  CHANGES_REQUESTED: ["IN_DESIGN", "DESIGN_REVIEW"],
  DESIGN_APPROVED: ["AWAITING_BODY_PHOTO"],
  AWAITING_BODY_PHOTO: ["SIMULATING"],
  SIMULATING: ["SIMULATION_REVIEW", "AWAITING_BODY_PHOTO"],
  SIMULATION_REVIEW: ["SIMULATION_APPROVED", "AWAITING_BODY_PHOTO"],
  SIMULATION_APPROVED: ["SCHEDULED"],
  // O tatuador marca a sessão como realizada (independente do pagamento final
  // do cliente) — sem isso, um cliente que esquece de pagar deixa o pedido
  // travado em SCHEDULED para sempre, sem nenhuma ação do lado do estúdio.
  SCHEDULED: ["SESSION_DONE", "CANCELLED"],
  SESSION_DONE: ["COMPLETED"],
  COMPLETED: ["REVIEWED"],
  REVIEWED: [],
  CANCELLED: [],
  REFUNDED: [],
};

export const TERMINAL_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "REVIEWED",
  "CANCELLED",
  "REFUNDED",
]);

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new ValidationError(`Transição inválida de ${from} para ${to}.`);
  }
}

/** Rótulos em pt-BR para a UI. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  SUBMITTED: "Enviado",
  QUOTED: "Orçado",
  DEPOSIT_PENDING: "Aguardando sinal",
  DEPOSIT_PAID: "Sinal pago",
  IN_DESIGN: "Em arte",
  DESIGN_REVIEW: "Arte em aprovação",
  CHANGES_REQUESTED: "Ajustes solicitados",
  DESIGN_APPROVED: "Arte aprovada",
  AWAITING_BODY_PHOTO: "Aguardando foto",
  SIMULATING: "Gerando simulação",
  SIMULATION_REVIEW: "Simulação em aprovação",
  SIMULATION_APPROVED: "Simulação aprovada",
  SCHEDULED: "Agendado",
  SESSION_DONE: "Sessão realizada",
  COMPLETED: "Concluído",
  REVIEWED: "Avaliado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};
