import { z } from "zod";

const httpUrl = z.string().url();

export const createPortfolioItemSchema = z
  .object({
    type: z.enum(["IMAGE", "VIDEO", "BEFORE_AFTER"]),
    mediaUrl: httpUrl.optional(),
    beforeUrl: httpUrl.optional(),
    afterUrl: httpUrl.optional(),
    description: z.string().max(600).optional().nullable(),
    tags: z.array(z.string().min(1).max(30)).max(12).default([]),
    styleId: z.string().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.type === "BEFORE_AFTER") {
      if (!v.beforeUrl || !v.afterUrl)
        ctx.addIssue({ code: "custom", message: "Antes e depois exigem as duas imagens." });
    } else if (!v.mediaUrl) {
      ctx.addIssue({ code: "custom", message: "Envie o arquivo de mídia." });
    }
  });
export type CreatePortfolioItemInput = z.infer<typeof createPortfolioItemSchema>;

export const updatePortfolioItemSchema = z.object({
  description: z.string().max(600).optional().nullable(),
  tags: z.array(z.string().min(1).max(30)).max(12).optional(),
  styleId: z.string().optional().nullable(),
});
export type UpdatePortfolioItemInput = z.infer<typeof updatePortfolioItemSchema>;

export const addCommentSchema = z.object({
  body: z.string().min(1, "Comentário vazio").max(500),
});
export type AddCommentInput = z.infer<typeof addCommentSchema>;
