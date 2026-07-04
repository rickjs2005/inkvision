import type { z } from "zod";
import { ValidationError } from "../domain/errors";

/**
 * Valida `input` contra `schema`, convertendo falhas do zod em ValidationError
 * (código VALIDATION → 400 na borda) em vez de deixar vazar um ZodError cru
 * (que viraria 500). Retorna os dados já tipados.
 */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new ValidationError(first?.message ?? "Dados inválidos.", result.error.flatten());
  }
  return result.data;
}
