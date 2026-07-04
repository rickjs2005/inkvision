import { z } from "zod";

export const sendMessageSchema = z
  .object({
    kind: z.enum(["TEXT", "AUDIO", "IMAGE", "PDF", "VIDEO"]).default("TEXT"),
    body: z.string().max(4000).optional(),
    attachmentUrl: z.string().url().optional(),
    attachmentMeta: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "TEXT") {
      if (!v.body || v.body.trim().length === 0)
        ctx.addIssue({ code: "custom", message: "Mensagem vazia." });
    } else if (!v.attachmentUrl) {
      ctx.addIssue({ code: "custom", message: "Anexo ausente." });
    }
  });
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
