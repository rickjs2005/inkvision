import { z } from "zod";

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, "Dê ao menos 1 estrela").max(5),
  comment: z.string().max(500).optional().nullable(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
