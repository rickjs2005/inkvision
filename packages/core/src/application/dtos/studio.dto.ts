import { z } from "zod";

const slugSchema = z
  .string()
  .min(3, "Slug muito curto")
  .max(48)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const createStudioSchema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  slug: slugSchema.optional(), // derivado do nome quando ausente
  description: z.string().max(600).optional(),
  ownerEmail: z.string().email("E-mail do dono inválido"),
});
export type CreateStudioInput = z.infer<typeof createStudioSchema>;

const addressSchema = z.object({
  street: z.string().max(160).optional().nullable(),
  city: z.string().max(80).optional().nullable(),
  state: z.string().max(40).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
});

export const updateStudioSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  logoUrl: z.string().url().optional().nullable(),
  description: z.string().max(600).optional().nullable(),
  address: addressSchema.optional(),
  phone: z.string().max(30).optional().nullable(),
  socials: z.record(z.string(), z.string().url()).optional().nullable(),
  openingHours: z.unknown().optional(),
});
export type UpdateStudioInput = z.infer<typeof updateStudioSchema>;

export const onboardingSchema = updateStudioSchema.extend({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const listStudiosSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  query: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListStudiosInput = z.infer<typeof listStudiosSchema>;
