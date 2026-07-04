import { randomBytes } from "node:crypto";
import type { CheckoutSession, PaymentGateway, PaymentKind } from "@inkvision/core";

const ref = (prefix: string) => `${prefix}_${randomBytes(8).toString("hex")}`;

/**
 * Gateway de pagamento para desenvolvimento. Não move dinheiro: o checkout é uma
 * página interna que simula o sucesso. Troque por StripePaymentGateway em prod
 * sem tocar nos casos de uso.
 */
export class MockPaymentGateway implements PaymentGateway {
  async connectStudio(studioId: string): Promise<{ accountId: string }> {
    return { accountId: `acct_mock_${studioId}` };
  }

  async createOrderCheckout(input: {
    orderId: string;
    kind: PaymentKind;
    amountCents: number;
  }): Promise<CheckoutSession> {
    return {
      providerRef: ref("pi_mock"),
      url: `/checkout/mock/${input.orderId}?kind=${input.kind.toLowerCase()}`,
    };
  }

  async createSubscriptionCheckout(input: {
    studioId: string;
    planSlug: string;
  }): Promise<CheckoutSession> {
    return {
      providerRef: ref("sub_mock"),
      url: `/checkout/assinatura?studio=${input.studioId}&plano=${input.planSlug}`,
    };
  }
}
