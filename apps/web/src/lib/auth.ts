import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@inkvision/db";
import { env } from "./env";

/**
 * Better Auth (server). Sessões em banco, e-mail/senha no Sprint 0.
 * `platformRole` é adicionado ao usuário; roles de estúdio vivem em StudioMember
 * e serão expostos via plugin `organization` na Sprint 1.
 */
/** Providers sociais registrados só quando o par de credenciais existe no env. */
const socialProviders = {
  ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
    : {}),
};

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders,
  account: {
    // Quem criou conta com e-mail/senha pode entrar depois com o Google do
    // MESMO e-mail (o Google verifica a posse do endereço).
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  user: {
    additionalFields: {
      platformRole: { type: "string", defaultValue: "USER", input: false },
      phone: { type: "string", required: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // renova a cada 24h de uso
  },
  advanced: {
    cookiePrefix: "inkvision",
  },
});

export type Session = typeof auth.$Infer.Session;
