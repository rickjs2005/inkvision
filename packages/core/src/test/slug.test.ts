import { describe, expect, it } from "vitest";
import { isReservedSlug, slugify } from "../domain/slug";

describe("slugify", () => {
  it("normaliza acentos e espaços", () => {
    expect(slugify("Estúdio São João")).toBe("estudio-sao-joao");
  });
  it("remove símbolos e hífens nas bordas", () => {
    expect(slugify("  Ink & Vision!! ")).toBe("ink-vision");
  });
  it("detecta slugs reservados", () => {
    expect(isReservedSlug("admin")).toBe(true);
    expect(isReservedSlug("estudio-alma")).toBe(false);
  });
});
