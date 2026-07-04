import { describe, expect, it } from "vitest";
import { sanitizeText } from "../domain/sanitize";
import { createReviewSchema } from "../application/dtos/review.dto";

describe("sanitizeText", () => {
  it("remove caracteres de controle e apara", () => {
    const dirty = `  oi${String.fromCharCode(0)}mundo${String.fromCharCode(7)}  `;
    expect(sanitizeText(dirty)).toBe("oimundo");
  });
  it("mantém quebra de linha e tab", () => {
    expect(sanitizeText("linha1\nlinha2\tfim")).toBe("linha1\nlinha2\tfim");
  });
  it("é aplicado nos DTOs (comentário de avaliação)", () => {
    const parsed = createReviewSchema.parse({ rating: 5, comment: "top " });
    expect(parsed.comment).toBe("top");
  });
});
