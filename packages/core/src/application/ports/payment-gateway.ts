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
export interface AccountStatus {
  /** Conta apta a receber cobranças (onboarding completo e aprovado). */
  chargesEnabled: boolean;
  /** Dono já enviou os dados do onboarding (pode estar em análise). */
  detailsSubmitted: boolean;
}

export interface PaymentGateway {
  /** Cria a conta conectada do estúdio (recebe os pagamentos). */
  connectStudio(studioId: string): Promise<{ accountId: string }>;
  /** Link de onboarding da conta conectada (Account Link no Stripe). Expira rápido — gerar sob demanda. */
  createAccountOnboardingLink(input: {
    accountId: string;
    /** Para onde o provedor manda o dono se o link expirar. */
    refreshUrl: string;
    /** Para onde o provedor manda o dono ao concluir/sair do onboarding. */
    returnUrl: string;
  }): Promise<{ url: string }>;
  /** Status da conta conectada — decide se o estúdio já pode receber. */
  getAccountStatus(accountId: string): Promise<AccountStatus>;
  /** Sessão de checkout para sinal/pagamento final de um pedido. */
  createOrderCheckout(input: {
    orderId: string;
    kind: PaymentKind;
    amountCents: number;
    /** Conta conectada do estúdio (destination charge). Ignorado pelo mock. */
    connectedAccountId?: string | null;
    /** Taxa da plataforma em centavos (application fee). Ignorado pelo mock. */
    applicationFeeCents?: number;
    /** Metadados propagados ao provedor e devolvidos no webhook. */
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession>;
  /** Sessão de checkout da assinatura do plano (Billing). */
  createSubscriptionCheckout(input: {
    studioId: string;
    planSlug: string;
  }): Promise<CheckoutSession>;
}
