import { describe, expect, it } from "vitest";
import { getSimulationProvider } from "./registry";
import { MockAiProvider } from "./providers/mock";

describe("AI registry", () => {
  it("resolve o mock por padrão", () => {
    expect(getSimulationProvider("mock")).toBeInstanceOf(MockAiProvider);
  });

  it("mock devolve as três variantes", async () => {
    const p = getSimulationProvider("mock");
    const res = await p.simulate({
      bodyPhotoUrl: "https://cdn/body.jpg",
      designUrl: "https://cdn/design.png",
      placement: { x: 0.5, y: 0.5, scale: 1, rotation: 0 },
    });
    expect(res.provider).toBe("mock");
    expect(Object.keys(res.variants)).toEqual(["small", "medium", "large"]);
  });

  it("provider real sem chave falha explicitamente", async () => {
    const p = getSimulationProvider("fal");
    await expect(
      p.simulate({ bodyPhotoUrl: "x", designUrl: "y", placement: { x: 0, y: 0, scale: 1, rotation: 0 } }),
    ).rejects.toThrow(/não configurado/);
  });
});
