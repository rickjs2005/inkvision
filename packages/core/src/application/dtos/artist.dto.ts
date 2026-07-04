import { z } from "zod";

export const addArtistSchema = z.object({
  email: z.string().email("E-mail inválido"),
});
export type AddArtistInput = z.infer<typeof addArtistSchema>;

export const updateArtistSchema = z.object({
  bio: z.string().max(1000).optional().nullable(),
  experienceYears: z.coerce.number().int().min(0).max(80).optional().nullable(),
  instagram: z
    .string()
    .max(60)
    .regex(/^@?[\w.]+$/, "Instagram inválido")
    .optional()
    .nullable(),
  avgPriceCents: z.coerce.number().int().min(0).optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});
export type UpdateArtistInput = z.infer<typeof updateArtistSchema>;

export const setStylesSchema = z.object({
  styleIds: z.array(z.string()).max(9),
});
export type SetStylesInput = z.infer<typeof setStylesSchema>;
