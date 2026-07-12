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

  it("provider real (fal) sem chave falha explicitamente", async () => {
    const p = getSimulationProvider("fal");
    expect(p.name).toBe("fal");
    await expect(
      p.simulate({
        bodyPhotoUrl: "x",
        designUrl: "y",
        composedImageUrl: "https://cdn/composed.jpg",
        placement: { x: 0, y: 0, scale: 1, rotation: 0 },
      }),
    ).rejects.toThrow(/FAL_API_KEY/);
  });

  it("provider real (fal) sem composedImageUrl falha explicitamente (a arte precisa estar composta na foto)", async () => {
    const p = getSimulationProvider("fal");
    await expect(
      p.simulate({ bodyPhotoUrl: "x", designUrl: "y", placement: { x: 0, y: 0, scale: 1, rotation: 0 } }),
    ).rejects.toThrow(/composedImageUrl/);
  });

  it("provider stub (replicate) sem chave falha explicitamente", async () => {
    const p = getSimulationProvider("replicate");
    await expect(
      p.simulate({ bodyPhotoUrl: "x", designUrl: "y", placement: { x: 0, y: 0, scale: 1, rotation: 0 } }),
    ).rejects.toThrow(/não configurado/);
  });

  it("provider real (stability) sem chave falha explicitamente", async () => {
    const p = getSimulationProvider("stability");
    expect(p.name).toBe("stability");
    await expect(
      p.simulate({
        bodyPhotoUrl: "x",
        designUrl: "y",
        composedImageUrl: "https://cdn/composed.jpg",
        placement: { x: 0, y: 0, scale: 1, rotation: 0 },
      }),
    ).rejects.toThrow(/STABILITY_API_KEY/);
  });

  it("provider real (stability) sem composedImageUrl falha explicitamente (a arte precisa estar composta na foto)", async () => {
    const p = getSimulationProvider("stability");
    await expect(
      p.simulate({ bodyPhotoUrl: "x", designUrl: "y", placement: { x: 0, y: 0, scale: 1, rotation: 0 } }),
    ).rejects.toThrow(/composedImageUrl/);
  });
});
