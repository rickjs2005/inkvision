import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@inkvision/db";
import { MockEmailService, ResendEmailService } from "@inkvision/infra";
import { env } from "./env";

// Mesmo critério do composition root (server/container.ts): Resend real
// quando a chave existe, mock (só loga) no dev. Instância própria aqui pra
// não precisar exportar o composition root inteiro só por isso.
const email = env.RESEND_API_KEY ? new ResendEmailService() : new MockEmailService();

const BRAND = "#8b1e2e";

function resetPasswordEmailHtml(url: string): string {
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f5f3f0;font-family:Georgia,serif;color:#1a1a1a;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;padding:32px 24px;">
<tr><td>
  <p style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND};margin:0 0 24px;">Ateliê de Tinta · InkVision</p>
  <h1 style="font-size:22px;margin:0 0 16px;">Redefinir sua senha</h1>
  <div style="font-size:15px;line-height:1.6;color:#333;">
    <p>Recebemos um pedido para redefinir a senha da sua conta.</p>
    <p>Se foi você, clique no botão abaixo. O link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
  </div>
  <p style="margin:28px 0;">
    <a href="${url}" style="background:${BRAND};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;display:inline-block;">Redefinir senha</a>
  </p>
</td></tr>
</table>
</body></html>`;
}

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
    sendResetPassword: async ({ user, url }) => {
      await email.send({
        to: user.email,
        subject: "Redefinir sua senha — InkVision",
        html: resetPasswordEmailHtml(url),
        text: `Recebemos um pedido para redefinir a senha da sua conta InkVision. Acesse ${url} para escolher uma nova senha (o link expira em 1 hora). Se não foi você, ignore este e-mail.`,
      });
    },
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
  // Sem isso, o better-auth usa seu limitador default em memória — não
  // funciona corretamente com múltiplas instâncias serverless/container
  // (cada instância teria seu próprio contador). `storage: "database"`
  // persiste os contadores no Postgres via o adapter Prisma já configurado.
  rateLimit: {
    enabled: true,
    window: 60, // segundos
    max: 100,
    storage: "database",
    // Rotas sensíveis (login/cadastro/pedido de redefinição de senha) ganham
    // um limite bem mais apertado e SEPARADO do bucket genérico acima — sem
    // isso, o mesmo "max: 100" valeria pra tentativas de senha e pra checagens
    // de sessão em série, facilitando força bruta. A chave do balde já é
    // ip+path no better-auth, então isso só ajusta os números por rota.
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
      "/request-password-reset": { window: 60, max: 3 },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
