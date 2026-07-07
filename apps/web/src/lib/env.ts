import { z } from "zod";

/** Valida variáveis de ambiente no boot do servidor. Falha cedo e explícito. */
const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET muito curto"),
  BETTER_AUTH_URL: z.string().url(),
  // Login social — opcional; o provider só é registrado quando o par existe.
  // Vazio ("" no .env/compose) conta como ausente, não como erro de validação.
  GOOGLE_CLIENT_ID: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  APP_URL: z.string().url(),
  ROOT_DOMAIN: z.string().min(1),
  // Stripe — opcional (mock é usado quando ausente, ver server/container.ts),
  // mas se presente precisa vir completo: ver .superRefine() abaixo.
  STRIPE_SECRET_KEY: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  // Resend — opcional (mock é usado quando ausente). EMAIL_FROM tem default
  // sensato em ResendEmailService, então não precisa de dependência cruzada.
  RESEND_API_KEY: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
  EMAIL_FROM: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
})
  .superRefine((data, ctx) => {
    const hasSecretKey = Boolean(data.STRIPE_SECRET_KEY);
    const hasWebhookSecret = Boolean(data.STRIPE_WEBHOOK_SECRET);
    if (hasSecretKey !== hasWebhookSecret) {
      const message =
        "STRIPE_SECRET_KEY e STRIPE_WEBHOOK_SECRET precisam estar configurados juntos — Stripe parcialmente configurado nunca confirma pagamentos.";
      ctx.addIssue({ code: "custom", path: ["STRIPE_SECRET_KEY"], message });
      ctx.addIssue({ code: "custom", path: ["STRIPE_WEBHOOK_SECRET"], message });
    }
  });

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuração de ambiente inválida — verifique o .env");
}

export const env = parsed.data;
