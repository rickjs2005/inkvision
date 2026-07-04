# InkVision

SaaS multi-tenant para estúdios de tatuagem — descoberta de artistas, briefing, orçamento, chat em tempo real, geração de arte, **simulação da tatuagem na foto do cliente por IA**, agendamento e pagamentos.

Arquitetura completa em [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 15 · React 19 · TypeScript · TailwindCSS v4 · shadcn/ui · Framer Motion · Prisma · PostgreSQL · Redis · Better Auth · Socket.IO · BullMQ · Cloudflare R2 · Stripe · Docker/Coolify.

## Monorepo

```
apps/     web (Next.js)  ·  realtime (Socket.IO)  ·  worker (BullMQ)
packages/ core  ·  db (Prisma)  ·  ai  ·  shared  ·  config
```

## Setup de desenvolvimento (sem Docker)

```bash
pnpm install
pnpm setup:local     # sobe o Postgres local do Prisma, configura o .env,
                     # aplica schema + RLS e o seed de demonstração
pnpm dev             # web :3000 · realtime :4000 · worker
```

Contas de teste e o roteiro completo de teste estão em **[TESTING.md](TESTING.md)**.
Healthcheck: `GET /api/health` → `{ status: "ok", db: "up" }`.

> Alternativa com Docker: `cp .env.example .env && pnpm infra:up && pnpm db:migrate && pnpm db:seed`.

## Camadas (Clean Architecture)

```
apps/web  (presentation + composition root)
  → @inkvision/core       domínio + aplicação (use-cases, ports, DTOs) — puro, sem IO
  → @inkvision/infra      repositórios Prisma (implementam os ports do core)
  → @inkvision/db         Prisma client + extensão de tenant + withStudio (RLS)
  → @inkvision/shared     tipos/constantes compartilhados
```

## Estado por sprint

- **Sprint 0 — Fundação ✅** monorepo, Docker, Prisma (schema completo + extensão multi-tenant), Better Auth (e-mail/senha + roles), tema dark/light shadcn, build de produção verde.
- **Sprint 1 — Multi-tenant + Estúdios ✅** RLS (`prisma/rls.sql` + `withStudio`), `packages/core` (use-cases de estúdio com authz), `packages/infra` (repos Prisma), auth UI (login/cadastro), painel admin (CRUD de estúdio), onboarding do dono, página pública `/s/[slug]`.
- **Sprint 2 — Artistas + Portfólio ✅** dono adiciona tatuador, tatuador edita perfil/estilos, portfólio (imagem/antes-depois) com upload **mockado** (`MockStorageService` — troca por R2 sem tocar use-cases), likes e comentários, descoberta pública `/tatuadores` (filtro por estilo), perfil público `/t/[artistId]`. RLS refinado: `ArtistProfile`/`PortfolioItem` são público-legíveis mas tenant-graváveis. 21 testes.
- **Sprint 3 — Descoberta + Home + SEO ✅** Home completa e **estática/ISR** (hero animado com busca, categorias, top tatuadores, galeria masonry, depoimentos, FAQ, CTA) com Framer Motion (respeita `prefers-reduced-motion`), layout de marketing compartilhado, `/estudios`, cache com `unstable_cache` + tags, e SEO (metadata, OG, JSON-LD Organization/WebSite/FAQ, `sitemap.xml` dinâmico, `robots.txt`).
- **Sprint 4 — Pedidos + Orçamento ✅** state machine do `Order` (16 estados, transições validadas no domínio), criar pedido com briefing + upload de referências (storage mock), orçamento do tatuador, aceite do cliente (→ DEPOSIT_PENDING), cancelamento, histórico `OrderEvent` (timeline), notificações in-app. RLS ganhou contexto de cliente (`withUser` + política "tenant OU dono") para o cliente ler pedidos cross-estúdio.
- **Sprint 5 — Chat realtime ✅** serviço `apps/realtime` (Socket.IO, relay fino autorizado por token de sala assinado — sem DB), chat por pedido (texto/imagem/áudio/vídeo/PDF via storage mock), indicador "digitando", confirmação enviado/lido, notificações de mensagem. Persistência+authz no web (RLS), realtime só relaya. Verificado ponta-a-ponta. Reforço futuro: Redis adapter no realtime.
- **Sprint 6 — Pagamentos ✅** gateway **mockado** (`MockPaymentGateway`): conectar conta do estúdio, sinal (application fee), confirmação **idempotente** → `DEPOSIT_PAID`, pagamento final, Billing (assinatura + **gate de limite de tatuadores**).
- **Sprint 7 — Camada de IA ✅** `packages/ai` plugável (ports + registry por env, `MockAiProvider` + stubs). Fluxo: arte → aprovação → foto do corpo → **simulação por IA** (fila in-process no dev, `apps/worker` BullMQ pronto) → cliente vê e aprova. `AiUsageLog`, realtime `simulation:done`.
- **Sprint 8 — Editor de simulação ✅** editor interativo (arrastar a arte sobre a foto, escala/rotação), geração com o placement escolhido, "ajustar posição", variantes P/M/G.
- **Sprint 9 — Agendamento ✅** disponibilidade semanal do tatuador + folgas, geração de horários (`generateSlots`, pura), agendamento pelo cliente (`SIMULATION_APPROVED → SCHEDULED`) com bloqueio de conflitos, reagendamento — **destrava o pagamento final** (`SCHEDULED → COMPLETED`).
- **Sprint 10 — Avaliações ✅** cliente avalia após concluir (`COMPLETED → REVIEWED`), recálculo da nota do tatuador, avaliações no perfil público. **Loop cadastro→avaliação fechado.**
- **Sprint 11 — Admin + LGPD ✅** dashboard com métricas (MRR, receita, estúdios, uso de IA, gráficos) via bypass de RLS por admin (`withAdmin`), logs de auditoria, e autoatendimento LGPD em `/conta` (exportar dados em JSON + excluir conta com anonimização).
- **Sprint 12 — Hardening ✅** headers de segurança (CSP, HSTS, X-Frame-Options, etc.) verificados no servidor real, rate limiting (janela deslizante) na rota de upload, checagem de origem (CSRF), sanitização de texto livre, e **PWA** (manifest + service worker offline). Checklist em [docs/SECURITY.md](docs/SECURITY.md).
- **Fluxo completo verificado ponta-a-ponta contra Postgres real**: `verify-flow.ts` (orçamento→avaliação) e `verify-admin.ts` (métricas cross-tenant + authz). 59 testes.
- **Deploy pronto ✅** Dockerfiles (web standalone, realtime, worker, migrate/init), `docker/compose.prod.yml`, migration inicial, init que cria o role não-superusuário + aplica RLS, e o guia [docs/DEPLOY.md](docs/DEPLOY.md) (Docker Compose e Coolify). Falta só rodar na VPS.

`AI_SIMULATION_PROVIDER=mock` (padrão) roda sem chaves. `pnpm dev` sobe web + realtime + worker.

Para o dev completo: `pnpm dev` sobe web (3000) + realtime (4000) via Turbo.

> Dev: a porta 3000 costuma estar ocupada pelo dev server do projeto AKATSUKI do Rick. Rode o InkVision noutra porta (`pnpm --filter @inkvision/web start -p 3100`) se precisar.

### Testes

```bash
pnpm -r test                              # unitários (sem DB)
RUN_DB_TESTS=1 pnpm --filter @inkvision/db test   # integração de isolamento (precisa do Postgres)
```
