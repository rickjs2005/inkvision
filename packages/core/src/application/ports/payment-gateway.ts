export type PaymentKind = "DEPOSIT" | "FINAL";

export interface CheckoutSession {
  /** Referência do provedor (ex.: payment intent). */
  providerRef: string;
  /** URL para o cliente concluir o pagamento. */
  url: string;
}

/**
 * Abstração do gateway de pagamento. Provedor concreto (Stripe Connect no futuro,
 * mock no dev) é injetado — trocar não afeta os casos de uso.
 */
export interface PaymentGateway {
  /** Onboarding da conta conectada do estúdio (recebe os pagamentos). */
  connectStudio(studioId: string): Promise<{ accountId: string }>;
  /** Sessão de checkout para sinal/pagamento final de um pedido. */
  createOrderCheckout(input: {
    orderId: string;
    kind: PaymentKind;
    amountCents: number;
  }): Promise<CheckoutSession>;
  /** Sessão de checkout da assinatura do plano (Billing). */
  createSubscriptionCheckout(input: {
    studioId: string;
    planSlug: string;
  }): Promise<CheckoutSession>;
}
