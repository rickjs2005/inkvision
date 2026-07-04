import type { PaymentKind } from "./payment-gateway";

export type PaymentStatus = "PENDING" | "SUCCEEDED" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  studioId: string;
  orderId: string;
  kind: PaymentKind;
  amountCents: number;
  feeCents: number;
  providerRef: string;
  status: PaymentStatus;
  createdAt: Date;
}

export interface CreatePaymentData {
  studioId: string;
  orderId: string;
  kind: PaymentKind;
  amountCents: number;
  feeCents: number;
  providerRef: string;
}

/** Todas as operações rodam em contexto de estúdio (Payment é studio-scoped). */
export interface PaymentRepository {
  createPending(data: CreatePaymentData): Promise<Payment>;
  findPendingForOrder(studioId: string, orderId: string, kind: PaymentKind): Promise<Payment | null>;
  markSucceeded(studioId: string, paymentId: string): Promise<Payment>;
  listForOrder(studioId: string, orderId: string): Promise<Payment[]>;
}
