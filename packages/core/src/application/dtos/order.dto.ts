import { z } from "zod";
import { sanitizeText } from "../../domain/sanitize";

export const createOrderSchema = z.object({
  artistId: z.string().min(1),
  styleId: z.string().optional().nullable(),
  bodyPart: z.string().min(2, "Informe a parte do corpo").max(80),
  approxSizeCm: z.coerce.number().int().min(1).max(200).optional().nullable(),
  briefing: z.string().min(10, "Descreva sua ideia com mais detalhes").max(2000).transform(sanitizeText),
  references: z
    .array(z.object({ fileUrl: z.string().url(), note: z.string().max(200).optional() }))
    .max(8)
    .default([]),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const sendQuoteSchema = z.object({
  quoteAmount: z.coerce.number().positive("Valor inválido"),
  depositAmount: z.coerce.number().positive("Sinal inválido"),
});
export type SendQuoteInput = z.infer<typeof sendQuoteSchema>;
