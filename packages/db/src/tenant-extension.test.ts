import { describe, expect, it } from "vitest";
import { scopeArgs } from "./tenant-extension";

const SID = "studio_abc";

describe("scopeArgs (isolamento de tenant — Camada 1)", () => {
  it("injeta studioId no where de findMany", () => {
    const r = scopeArgs("Order", "findMany", { where: { status: "SUBMITTED" } }, SID);
    expect(r.args.where).toEqual({ status: "SUBMITTED", studioId: SID });
  });

  it("adiciona studioId ao where do findUnique (sem reescrever a operação)", () => {
    const r = scopeArgs("Order", "findUnique", { where: { id: "o1" } }, SID);
    expect(r.operation).toBe("findUnique");
    expect(r.args.where).toEqual({ id: "o1", studioId: SID });
  });

  it("injeta studioId no data de create", () => {
    const r = scopeArgs("Payment", "create", { data: { amountCents: 100 } }, SID);
    expect(r.args.data).toEqual({ amountCents: 100, studioId: SID });
  });

  it("injeta studioId em cada item de createMany", () => {
    const r = scopeArgs("Review", "createMany", { data: [{ rating: 5 }, { rating: 4 }] }, SID);
    expect(r.args.data).toEqual([
      { rating: 5, studioId: SID },
      { rating: 4, studioId: SID },
    ]);
  });

  it("restringe update ao tenant", () => {
    const r = scopeArgs("Order", "update", { where: { id: "o1" }, data: { bodyPart: "braço" } }, SID);
    expect(r.args.where).toEqual({ id: "o1", studioId: SID });
  });

  it("não toca modelos fora do escopo de tenant", () => {
    const r = scopeArgs("User", "findMany", { where: { email: "a@b.com" } }, SID);
    expect(r.args.where).toEqual({ email: "a@b.com" });
    expect(r.operation).toBe("findMany");
  });

  it("cria where mesmo quando ausente", () => {
    const r = scopeArgs("Conversation", "findMany", {}, SID);
    expect(r.args.where).toEqual({ studioId: SID });
  });
});
