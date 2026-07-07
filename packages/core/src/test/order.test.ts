import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import { assertTransition, canTransition } from "../domain/order-state-machine";
import { CreateOrderUseCase } from "../application/use-cases/order/create-order";
import { SendQuoteUseCase } from "../application/use-cases/order/send-quote";
import { AcceptQuoteUseCase } from "../application/use-cases/order/client-actions";
import { InMemoryAudit, InMemoryEmailService, InMemoryUserRepo } from "./fakes";
import { InMemoryArtistRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };
const artistActor: Actor = { userId: "u_artist", platformRole: "USER", memberships: [{ studioId: STUDIO, role: "ARTIST" }] };
const stranger: Actor = { userId: "u_x", platformRole: "USER", memberships: [] };

describe("state machine", () => {
  it("aceita transições válidas e barra inválidas", () => {
    expect(canTransition("SUBMITTED", "QUOTED")).toBe(true);
    expect(canTransition("SUBMITTED", "DEPOSIT_PAID")).toBe(false);
    expect(canTransition("CANCELLED", "QUOTED")).toBe(false);
    expect(() => assertTransition("QUOTED", "SCHEDULED")).toThrow();
  });
});

describe("fluxo de pedido", () => {
  let orders: InMemoryOrderRepo;
  let artists: InMemoryArtistRepo;
  let notifications: InMemoryNotificationRepo;
  let audit: InMemoryAudit;
  let users: InMemoryUserRepo;
  let email: InMemoryEmailService;
  let artistId: string;

  beforeEach(() => {
    orders = new InMemoryOrderRepo();
    artists = new InMemoryArtistRepo();
    notifications = new InMemoryNotificationRepo();
    audit = new InMemoryAudit();
    users = new InMemoryUserRepo([{ id: "u_client", name: "Cliente", email: "cliente@teste.com" }]);
    email = new InMemoryEmailService();
    artistId = artists.seed({ userId: "u_artist", studioId: STUDIO, name: "Rafa" }).id;
  });

  const deps = () => ({ orders, artists, notifications, audit, users, email, appUrl: "https://inkvision.app" });

  async function submit() {
    const uc = new CreateOrderUseCase(deps());
    return uc.execute(client, {
      artistId,
      bodyPart: "antebraço",
      briefing: "Quero um leão em fine line no antebraço direito.",
      references: [],
    });
  }

  it("cria pedido SUBMITTED com studioId derivado e notifica o tatuador", async () => {
    const order = await submit();
    expect(order.status).toBe("SUBMITTED");
    expect(order.studioId).toBe(STUDIO);
    expect(await notifications.countUnread("u_artist")).toBe(1);
  });

  it("exige autenticação para criar", async () => {
    const uc = new CreateOrderUseCase(deps());
    await expect(
      uc.execute(null, { artistId, bodyPart: "braço", briefing: "0123456789012", references: [] }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("tatuador envia orçamento → QUOTED e notifica cliente", async () => {
    const order = await submit();
    const uc = new SendQuoteUseCase(deps());
    const quoted = await uc.execute(artistActor, STUDIO, order.id, { quoteAmount: 900, depositAmount: 300 });
    expect(quoted.status).toBe("QUOTED");
    expect(quoted.quoteAmountCents).toBe(90000);
    expect(quoted.depositCents).toBe(30000);
    expect(await notifications.countUnread("u_client")).toBe(1);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]!.to).toBe("cliente@teste.com");
  });

  it("estranho não pode orçar", async () => {
    const order = await submit();
    const uc = new SendQuoteUseCase(deps());
    await expect(
      uc.execute(stranger, STUDIO, order.id, { quoteAmount: 900, depositAmount: 300 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("cliente aceita orçamento → DEPOSIT_PENDING", async () => {
    const order = await submit();
    await new SendQuoteUseCase(deps()).execute(artistActor, STUDIO, order.id, { quoteAmount: 900, depositAmount: 300 });
    const accepted = await new AcceptQuoteUseCase(deps()).execute(client, order.id);
    expect(accepted.status).toBe("DEPOSIT_PENDING");
  });

  it("não aceita orçamento antes de estar QUOTED", async () => {
    const order = await submit();
    await expect(new AcceptQuoteUseCase(deps()).execute(client, order.id)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });
});
