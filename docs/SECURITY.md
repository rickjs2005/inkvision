# Segurança — InkVision

Resumo das medidas implementadas e do que verificar antes de produção.

## Implementado

| Item | Onde |
|---|---|
| **Isolamento multi-tenant** | Extensão do Prisma injeta `studioId` em toda query (`packages/db/tenant-extension.ts`) + **RLS** no Postgres (`prisma/rls.sql`) com `withStudio`/`withUser`/`withAdmin` |
| **Headers de segurança** | `next.config.ts`: CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod) |
| **Rate limiting** | `src/server/rate-limit.ts` (janela deslizante) aplicado na rota de upload (30/min por usuário) |
| **CSRF** | Server Actions do Next têm proteção nativa; rota de upload valida `Origin` (`same-origin`) |
| **Validação** | Zod em toda borda (`parseInput` → 400) |
| **Sanitização** | `sanitizeText` (remove caracteres de controle) em briefing, mensagens e avaliações; o React escapa na renderização (anti-XSS) |
| **Uploads** | Presigned com validação de MIME e tamanho por propósito (`UPLOAD_LIMITS`) |
| **Autorização** | Em todo caso de uso via `Actor` (papel de plataforma + memberships), nunca só na UI |
| **Auditoria** | `AuditLog` grava ações sensíveis; visível em `/admin/logs` |
| **LGPD** | Export de dados + exclusão (anonimização) em `/conta` |
| **PWA** | Manifest + service worker (offline shell, só em produção) |

## ⚠️ Obrigatório antes de produção

1. **Role não-superusuário no banco.** O app DEVE conectar com um role `NOSUPERUSER NOBYPASSRLS` (ver `prisma/create-app-role.sql`). Superusuários ignoram o RLS — a Camada 2 só vale com um role dedicado.
2. **Rate limit com Redis.** O store atual é em memória (ok para instância única). Em produção multi-instância, trocar por Redis (a interface em `rate-limit.ts` não muda).
3. **Verificação de magic bytes nos uploads.** Hoje o MIME é o declarado pelo cliente. Ao ligar o R2 real, validar os bytes do arquivo no worker após o upload.
4. **Segredos.** Gerar `BETTER_AUTH_SECRET` e `REALTIME_EMIT_SECRET` fortes; nunca commitar `.env`.
5. **CSP baseada em nonce.** Hoje usa `'unsafe-inline'` em script/style (necessário sem infra de nonce). Migrar para nonce quando possível.
6. **Cookies de sessão.** Confirmar `Secure` + `SameSite=Lax` em produção (HTTPS).
7. **Webhooks reais (Stripe).** Ao ligar o Stripe, validar a assinatura do webhook e persistir `event.id` para idempotência.
