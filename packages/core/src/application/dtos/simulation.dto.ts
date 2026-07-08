import { z } from "zod";

export const sendDesignSchema = z.object({
  imageUrl: z.string().url(),
  notes: z.string().max(500).optional().nullable(),
});
export type SendDesignInput = z.infer<typeof sendDesignSchema>;

export const reviewDesignSchema = z
  .object({
    approve: z.boolean(),
    feedback: z.string().max(500).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (!v.approve && !v.feedback?.trim()) {
      ctx.addIssue({ code: "custom", message: "Descreva o que ajustar." });
    }
  });
export type ReviewDesignInput = z.infer<typeof reviewDesignSchema>;

const placementSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  scale: z.number().min(0.1).max(5),
  rotation: z.number().min(-180).max(180),
});

export const requestSimulationSchema = z.object({
  bodyPhotoUrl: z.string().url(),
  /** Foto + arte já compostas (canvas), na posição escolhida — vai para a IA. */
  composedImageUrl: z.string().url().optional(),
  placement: placementSchema.default({ x: 0.5, y: 0.5, scale: 1, rotation: 0 }),
});
export type RequestSimulationInput = z.infer<typeof requestSimulationSchema>;
