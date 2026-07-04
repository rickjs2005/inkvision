import type { OrderStatus } from "../../domain/order-state-machine";

export interface OrderReference {
  id: string;
  fileUrl: string;
  note?: string | null;
}

export interface OrderEvent {
  id: string;
  from: OrderStatus | null;
  to: OrderStatus;
  actorId: string | null;
  metadata?: unknown;
  createdAt: Date;
}

export interface Order {
  id: string;
  studioId: string;
  clientId: string;
  clientName?: string;
  artistId: string;
  artistName?: string;
  styleId?: string | null;
  bodyPart: string;
  approxSizeCm?: number | null;
  briefing: string;
  status: OrderStatus;
  quoteAmountCents?: number | null;
  depositCents?: number | null;
  currency: string;
  references: OrderReference[];
  events: OrderEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderData {
  studioId: string;
  clientId: string;
  artistId: string;
  styleId?: string | null;
  bodyPart: string;
  approxSizeCm?: number | null;
  briefing: string;
  references: { fileUrl: string; note?: string | null }[];
}

export interface TransitionInput {
  from: OrderStatus;
  to: OrderStatus;
  actorId: string;
  metadata?: Record<string, unknown>;
  /** Aplicado junto com a transição (ex.: valores do orçamento). */
  patch?: { quoteAmountCents?: number; depositCents?: number };
}

export interface OrderRepository {
  create(data: CreateOrderData): Promise<Order>;
  /** Leitura em contexto de estúdio (artista/gerente). */
  findByIdForStudio(orderId: string, studioId: string): Promise<Order | null>;
  /** Leitura em contexto do cliente dono (cross-estúdio). */
  findByIdForClient(orderId: string, clientId: string): Promise<Order | null>;
  listForClient(clientId: string): Promise<Order[]>;
  listForArtist(artistId: string, studioId: string): Promise<Order[]>;
  /** Aplica a transição + grava OrderEvent atomicamente (contexto de estúdio). */
  transition(orderId: string, studioId: string, input: TransitionInput): Promise<Order>;
}
