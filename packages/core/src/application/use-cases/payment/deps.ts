import type { ArtistRepository } from "../../ports/artist-repository";
import type { StudioRepository } from "../../ports/studio-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { PaymentRepository } from "../../ports/payment-repository";
import type { PaymentGateway } from "../../ports/payment-gateway";
import type { SubscriptionRepository } from "../../ports/subscription-repository";
import type { NotificationRepository } from "../../ports/notification-repository";
import type { AuditLogger } from "../../ports/audit-logger";

export interface PaymentUseCaseDeps {
  payments: PaymentRepository;
  orders: OrderRepository;
  studios: Pick<StudioRepository, "findById" | "setStripeAccount">;
  artists: Pick<ArtistRepository, "findById">;
  subscriptions: SubscriptionRepository;
  gateway: PaymentGateway;
  notifications: NotificationRepository;
  audit: AuditLogger;
  /** Percentual retido pela plataforma (application fee). */
  platformFeePercent: number;
}

export function feeFor(amountCents: number, percent: number): number {
  return Math.round((amountCents * percent) / 100);
}
