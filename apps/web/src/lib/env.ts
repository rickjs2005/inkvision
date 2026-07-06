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
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variáveis de ambiente inválidas:", parsed.error.flatten().fieldErrors);
  throw new Error("Configuração de ambiente inválida — verifique o .env");
}

export const env = parsed.data;
