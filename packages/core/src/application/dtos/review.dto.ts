import { z } from "zod";
import { sanitizeText } from "../../domain/sanitize";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Dê ao menos 1 estrela").max(5),
  comment: z.string().max(500).transform(sanitizeText).optional().nullable(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
