import Stripe from "stripe";
import type { AccountStatus, CheckoutSession, PaymentGateway, PaymentKind } from "@inkvision/core";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/**
 * Gateway de pagamento real (Stripe Connect). Cobra o cliente e repassa ao
 * estúdio (destination charge) retendo a taxa da plataforma (application fee).
 * O metadata (orderId/kind/studioId) volta no webhook, que confirma o pedido de
 * forma segura — nunca confie na confirmação vinda do cliente.
 *
 * Pendência conhecida p/ produção plena: mapear cada plano a um Price do Stripe
 * (STRIPE_PRICE_<SLUG> em env).
 */
export class StripePaymentGateway implements PaymentGateway {
  private readonly stripe: Stripe;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY) {
    if (!secretKey) throw new Error("STRIPE_SECRET_KEY não configurada.");
    this.stripe = new Stripe(secretKey);
  }

  async connectStudio(studioId: string): Promise<{ accountId: string }> {
    const account = await this.stripe.accounts.create({
      type: "express",
      metadata: { studioId },
    });
    return { accountId: account.id };
  }

  async createAccountOnboardingLink(input: {
    accountId: string;
    refreshUrl: string;
    returnUrl: string;
  }): Promise<{ url: string }> {
    const link = await this.stripe.accountLinks.create({
      account: input.accountId,
      refresh_url: input.refreshUrl,
      return_url: input.returnUrl,
      type: "account_onboarding",
    });
    return { url: link.url };
  }

  async getAccountStatus(accountId: string): Promise<AccountStatus> {
    const account = await this.stripe.accounts.retrieve(accountId);
    return {
      chargesEnabled: account.charges_enabled === true,
      detailsSubmitted: account.details_submitted === true,
    };
  }

  async createOrderCheckout(input: {
    orderId: string;
    kind: PaymentKind;
    amountCents: number;
    connectedAccountId?: string | null;
    applicationFeeCents?: number;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession> {
    if (!input.connectedAccountId) {
      throw new Error("Estúdio sem conta Stripe conectada.");
    }
    const metadata = input.metadata ?? {};
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "brl",
            unit_amount: input.amountCents,
            product_data: {
              name: input.kind === "DEPOSIT" ? "Sinal da tatuagem" : "Pagamento final",
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: input.applicationFeeCents ?? 0,
        transfer_data: { destination: input.connectedAccountId },
        metadata,
      },
      metadata,
      success_url: `${APP_URL}/pedidos/${input.orderId}?pago=1`,
      cancel_url: `${APP_URL}/pedidos/${input.orderId}`,
    });
    return { providerRef: session.id, url: session.url ?? `${APP_URL}/pedidos/${input.orderId}` };
  }

  async createSubscriptionCheckout(input: {
    studioId: string;
    planSlug: string;
  }): Promise<CheckoutSession> {
    // MVP: exige um mapa plano→priceId em env (STRIPE_PRICE_<SLUG>). Falha claro
    // se não configurado, em vez de cobrar valor errado.
    const priceId = process.env[`STRIPE_PRICE_${input.planSlug.toUpperCase()}`];
    if (!priceId) throw new Error(`Price do Stripe não configurado para o plano ${input.planSlug}.`);
    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { studioId: input.studioId, planSlug: input.planSlug },
      success_url: `${APP_URL}/painel?assinado=1`,
      cancel_url: `${APP_URL}/painel`,
    });
    return { providerRef: session.id, url: session.url ?? `${APP_URL}/painel` };
  }
}

/**
 * Verifica a assinatura do webhook do Stripe e retorna o evento. Lança se a
 * assinatura for inválida (defesa contra confirmações forjadas).
 */
export function parseStripeWebhook(rawBody: string, signature: string): Stripe.Event {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) throw new Error("Stripe webhook não configurado.");
  const stripe = new Stripe(secretKey);
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
}
