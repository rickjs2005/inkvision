import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import type {
  CheckoutSession,
  PaymentGateway,
  PaymentKind,
} from "../application/ports/payment-gateway";
import type {
  CreatePaymentData,
  Payment,
  PaymentRepository,
} from "../application/ports/payment-repository";
import {
  ConfirmOrderPaymentUseCase,
  StartOrderPaymentUseCase,
} from "../application/use-cases/payment/order-payment";
import {
  ConnectStudioPaymentsUseCase,
  GetPaymentsAccountStatusUseCase,
} from "../application/use-cases/payment/connect-studio";
import {
  ConfirmSubscriptionByReferenceUseCase,
  ConfirmSubscriptionUseCase,
} from "../application/use-cases/payment/subscription";
import { InMemoryAudit, InMemoryStudioRepo } from "./fakes";
import { InMemoryArtistRepo, InMemorySubscriptionRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

class InMemoryPaymentRepo implements PaymentRepository {
  payments: Payment[] = [];
  async createPending(data: CreatePaymentData) {
    const p: Payment = { id: `pay_${this.payments.length + 1}`, status: "PENDING", createdAt: new Date(0), ...data };
    this.payments.push(p);
    return p;
  }
  async findPendingForOrder(studioId: string, orderId: string, kind: PaymentKind) {
    return this.payments.find((p) => p.studioId === studioId && p.orderId === orderId && p.kind === kind && p.status === "PENDING") ?? null;
  }
  async markSucceeded(_studioId: string, paymentId: string) {
    const p = this.payments.find((x) => x.id === paymentId)!;
    p.status = "SUCCEEDED";
    return p;
  }
  async listForOrder(studioId: string, orderId: string) {
    return this.payments.filter((p) => p.studioId === studioId && p.orderId === orderId);
  }
}

class MockGateway implements PaymentGateway {
  /** Contas criadas — deixa os testes afirmarem que NÃO houve conta órfã. */
  created: string[] = [];
  chargesEnabled = false;

  async connectStudio(studioId: string) {
    const accountId = `acct_${studioId}_${this.created.length + 1}`;
    this.created.push(accountId);
    return { accountId };
  }
  async createAccountOnboardingLink(input: { accountId: string; refreshUrl: string; returnUrl: string }) {
    return { url: `https://connect.mock/onboarding/${input.accountId}?return=${encodeURIComponent(input.returnUrl)}` };
  }
  async getAccountStatus(_accountId: string) {
    return { chargesEnabled: this.chargesEnabled, detailsSubmitted: this.chargesEnabled };
  }
  async createOrderCheckout(input: { orderId: string; kind: PaymentKind }): Promise<CheckoutSession> {
    return { providerRef: `pi_${input.orderId}_${input.kind}`, url: `/checkout/mock/${input.orderId}?kind=${input.kind}` };
  }
  async createSubscriptionCheckout(input: { studioId: string; planSlug: string }): Promise<CheckoutSession> {
    return { providerRef: `sub_${input.studioId}`, url: `/checkout/mock/sub` };
  }
}

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };
const owner: Actor = { userId: "u_owner", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "OWNER" }] };

describe("pagamentos (mock)", () => {
  let payments: InMemoryPaymentRepo;
  let orders: InMemoryOrderRepo;
  let studios: InMemoryStudioRepo;
  let artists: InMemoryArtistRepo;
  let subscriptions: InMemorySubscriptionRepo;
  let notifications: InMemoryNotificationRepo;
  let orderId: string;

  async function deposit(depositPending = true, connected = true) {
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const order = await orders.create({
      studioId: STUDIO,
      clientId: "u_client",
      artistId: artist.id,
      bodyPart: "braço",
      briefing: "x".repeat(12),
      references: [],
    });
    order.depositCents = 30000;
    order.quoteAmountCents = 90000;
    if (depositPending) order.status = "DEPOSIT_PENDING";
    orderId = order.id;
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    if (connected) studios.studios[0]!.stripeAccountId = "acct_x";
  }

  const deps = (overrides?: { allowSelfConfirmation?: boolean }) => ({
    payments,
    orders,
    studios,
    artists,
    subscriptions,
    gateway: new MockGateway(),
    notifications,
    audit: new InMemoryAudit(),
    platformFeePercent: 10,
    allowSelfConfirmation: overrides?.allowSelfConfirmation ?? true,
  });

  beforeEach(() => {
    payments = new InMemoryPaymentRepo();
    orders = new InMemoryOrderRepo();
    studios = new InMemoryStudioRepo();
    artists = new InMemoryArtistRepo();
    subscriptions = new InMemorySubscriptionRepo();
    notifications = new InMemoryNotificationRepo();
  });

  it("inicia o sinal criando um Payment pendente com fee de 10%", async () => {
    await deposit();
    const { url } = await new StartOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    expect(url).toContain("kind=DEPOSIT");
    expect(payments.payments).toHaveLength(1);
    expect(payments.payments[0]!.feeCents).toBe(3000); // 10% de 30000
  });

  it("bloqueia o sinal se o estúdio não conectou pagamentos", async () => {
    await deposit(true, false);
    await expect(
      new StartOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT"),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("confirma o sinal → DEPOSIT_PAID, marca o Payment e notifica o tatuador", async () => {
    await deposit();
    await new StartOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    const updated = await new ConfirmOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    expect(updated.status).toBe("DEPOSIT_PAID");
    expect(payments.payments[0]!.status).toBe("SUCCEEDED");
    expect(await notifications.countUnread("u_artist")).toBe(1);
  });

  it("confirmação é idempotente (segunda chamada é no-op)", async () => {
    await deposit();
    await new StartOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    await new ConfirmOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    const again = await new ConfirmOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    expect(again.status).toBe("DEPOSIT_PAID");
    expect(await notifications.countUnread("u_artist")).toBe(1); // não notifica de novo
  });

  it("confirmar assinatura ativa o plano do estúdio", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    await new ConfirmSubscriptionUseCase(
      { studios, subscriptions, audit: new InMemoryAudit(), allowSelfConfirmation: true },
      () => new Date(0),
    ).execute(owner, STUDIO, "pro");
    const active = await subscriptions.getActiveForStudio(STUDIO);
    expect(active?.maxArtists).toBe(8);
  });

  it("com Stripe real (allowSelfConfirmation=false), o cliente NÃO consegue confirmar o próprio pagamento", async () => {
    await deposit();
    await new StartOrderPaymentUseCase(deps()).execute(client, orderId, "DEPOSIT");
    await expect(
      new ConfirmOrderPaymentUseCase(deps({ allowSelfConfirmation: false })).execute(client, orderId, "DEPOSIT"),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    // o pedido continua pendente — nada foi liberado de graça.
    expect(orders.orders.find((o) => o.id === orderId)!.status).toBe("DEPOSIT_PENDING");
    expect(payments.payments[0]!.status).toBe("PENDING");
  });

  it("com Stripe real (allowSelfConfirmation=false), o dono NÃO consegue confirmar a própria assinatura", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    await expect(
      new ConfirmSubscriptionUseCase(
        { studios, subscriptions, audit: new InMemoryAudit(), allowSelfConfirmation: false },
        () => new Date(0),
      ).execute(owner, STUDIO, "pro"),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await subscriptions.getActiveForStudio(STUDIO)).toBeNull();
  });

  it("webhook do provedor confirma a assinatura sem depender do actor (ConfirmSubscriptionByReferenceUseCase)", async () => {
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
    await new ConfirmSubscriptionByReferenceUseCase(
      { studios, subscriptions, audit: new InMemoryAudit() },
      () => new Date(0),
    ).execute({ studioId: STUDIO, planSlug: "pro" });
    const active = await subscriptions.getActiveForStudio(STUDIO);
    expect(active?.maxArtists).toBe(8);
  });

  it("webhook com referência de estúdio desconhecida é ignorado com segurança", async () => {
    await expect(
      new ConfirmSubscriptionByReferenceUseCase({ studios, subscriptions, audit: new InMemoryAudit() }).execute({
        studioId: "estudio_inexistente",
        planSlug: "pro",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("onboarding da conta de recebimento (Connect)", () => {
  const URLS = { refreshUrl: "https://app/planos?connect=refresh", returnUrl: "https://app/planos?connect=retorno" };
  let studios: InMemoryStudioRepo;
  let gateway: MockGateway;

  const connectDeps = () => ({ studios, gateway, audit: new InMemoryAudit() });

  beforeEach(async () => {
    studios = new InMemoryStudioRepo();
    gateway = new MockGateway();
    await studios.create({ slug: "alma", name: "Alma" });
    studios.studios[0]!.id = STUDIO;
  });

  it("cria a conta na 1ª vez, persiste no estúdio e devolve o link de onboarding", async () => {
    const res = await new ConnectStudioPaymentsUseCase(connectDeps()).execute(owner, STUDIO, URLS);
    expect(gateway.created).toHaveLength(1);
    expect(studios.studios[0]!.stripeAccountId).toBe(res.accountId);
    expect(res.url).toContain(res.accountId);
    expect(res.url).toContain(encodeURIComponent(URLS.returnUrl));
  });

  it("reusa a conta existente — clicar de novo NÃO cria conta órfã", async () => {
    const uc = new ConnectStudioPaymentsUseCase(connectDeps());
    const first = await uc.execute(owner, STUDIO, URLS);
    const second = await uc.execute(owner, STUDIO, URLS);
    expect(gateway.created).toHaveLength(1);
    expect(second.accountId).toBe(first.accountId);
  });

  it("só o OWNER inicia o onboarding", async () => {
    await expect(
      new ConnectStudioPaymentsUseCase(connectDeps()).execute(client, STUDIO, URLS),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("status: null sem conta; reflete o provedor com conta", async () => {
    const uc = new GetPaymentsAccountStatusUseCase(connectDeps());
    expect(await uc.execute(owner, STUDIO)).toBeNull();

    await new ConnectStudioPaymentsUseCase(connectDeps()).execute(owner, STUDIO, URLS);
    const pending = await uc.execute(owner, STUDIO);
    expect(pending).toMatchObject({ chargesEnabled: false, detailsSubmitted: false });

    gateway.chargesEnabled = true;
    const enabled = await uc.execute(owner, STUDIO);
    expect(enabled).toMatchObject({ chargesEnabled: true });
  });
});
