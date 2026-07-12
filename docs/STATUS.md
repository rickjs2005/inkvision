# InkVision — Estado atual & o que falta

_Última atualização: 2026-07-07 — sessão completa: backlog de código zerado (itens 1–11), deploy de teste vivo na Vercel+Neon (inkvision-eight.vercel.app), CI com E2E de produção, fluxo de materialização tatuador→cliente verificado em WebKit/iPhone com gestos de toque, 10+ bugs reais corrigidos (o último: .env local vazando REDIS_URL pro deploy CLI). E-mails transacionais + lembrete de sessão implementados, auditoria de segurança (3 gaps corrigidos: injeção de HTML nos e-mails, rate limiting incompleto, segredos parciais sem validação no boot) e o fluxo de materialização testado ponta a ponta com usuários reais (2 bugs achados e corrigidos). Pendências: só credenciais (Google/Fal/Stripe/R2/Resend) e a VPS — ver seções abaixo._
_Repo: https://github.com/rickjs2005/inkvision (branch `main`)._

---

## ✅ O que já está pronto

### Produto (Sprints 0–12)
- SaaS multi-tenant completo: cliente, tatuador, dono de estúdio, admin.
- Fluxo inteiro: descoberta → pedido → chat em tempo real → arte → **simulação** → agendamento → pagamento → avaliação.
- Multi-tenancy em 3 camadas (extensão Prisma + RLS + testes de isolamento).
- Admin (métricas, gestão de estúdios, logs), LGPD (export/anonimização).
- **60 testes** verdes; typecheck limpo; build compila (no Windows só o passo de symlink do `standalone` falha — funciona no Docker/Linux).

### Hardening (10 itens críticos da auditoria) — commit `f175a3d`
- Segredos falham duro em produção · Socket.IO com adapter Redis · fila BullMQ · rate limit distribuído · **webhook Stripe assinado** (confirmação de pagamento server-side) · guard de RLS no boot (não-superusuário) · constraint anti-overbooking · provider de IA real (`FalProvider`) · CI (GitHub Actions) · observabilidade (pino + Sentry).

### Redesign "Ateliê de Tinta" (identidade própria)
- Paleta **Ink Noir + Vermilion**, fontes **Fraunces + Geist**, primitivos autorais, marca própria (monograma gota+agulha).
- Home cinematográfica: **hero com demonstração de IA** (foto real, scanner, HUD, antes→depois), CTA, busca segmentada, prova social, navbar com scroll.
- Auth como experiência: **demo de IA reutilizada** na lateral, inputs premium (label flutuante, validação em tempo real, força de senha, mostrar/ocultar), login social (UI), benefícios, prova.
- **Todas as telas niveladas** ao padrão hero/login: `components/ui/field.tsx` (campos premium) adotado em todos os formulários; páginas públicas com CTA/prova; dashboards com estados vazios editoriais.

### Simulador público `/simular` — commit `396193a`
- Página pública, **sem login, 100% client-side**: escolhe pele (foto própria ou sintética) → escolhe desenho (5 SVG fine-line) → posiciona (arrastar/escala/rotação) → baixa a prévia. CTA → `/cadastro`.

### Prova social com dados REAIS
- `getPublicStats` (cacheado 5 min, tag `home:public-stats`): simulações (AiUsageLog via admin), estúdios ativos, média/contagem de avaliações (ponderada de `ArtistProfile`). Falha de banco **não é cacheada** (catch fora do `unstable_cache`) → telas escondem a faixa em vez de inventar número.
- Hero: números + chip rotativo com os **tatuadores reais** do topo. Diretórios `/tatuadores` e `/estudios` usam `<ProofStrip>` compartilhado. Grupo auth: layout busca stats e injeta via `AuthStatsProvider` (páginas são client). Seed demo agora cria 38 `AiUsageLog` de simulação.

### Login social Google — commit `5f4b64b`
- `socialProviders.google` no better-auth, condicional a `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` no env. Sem credenciais, botão degrada pro toast "em breve"; com credenciais, funciona sozinho (account linking confiável pro mesmo e-mail).

### `/simular` com IA real — commit `8b88eb5`
- Com `FAL_API_KEY`, botão "Ver com IA real" chama `POST /api/simular` (rate limit 5/10min por IP, prompt fixo no servidor) e a Fal refina a composição via img2img.

### Deploy de TESTE ao vivo na Vercel + Neon — **https://inkvision-eight.vercel.app**
- Banco: projeto Neon (São Paulo) via integração Vercel; migrations + RLS + role `inkvision_app` (não-superusuário, `bypass_rls=false` confirmado) aplicados na conexão direta. A app roda com o role dedicado, nunca com o `neondb_owner`.
- Seed de demo aplicado nesse banco (Estúdio Alma, Rafa/Bia, 1 pedido) — o site mostra dados reais, não vazio.
- **3 bugs reais encontrados e corrigidos** só de tentar rodar em produção pela primeira vez (nenhum ambiente até então exercia esses caminhos):
  1. **Migration `1_appointment_no_overlap` quebrava em `migrate deploy` de verdade** — `tstzrange()` num índice exigia cast timestamp→timestamptz dependente do fuso da sessão (STABLE, não IMMUTABLE); trocado para `tsrange()` (bate com o tipo real da coluna). Nunca fora exercida: local usa `db push` (ignora SQL bruto) e o CI não roda migrations — **isso bloquearia o primeiro deploy na VPS também**.
  2. **Next.js 15.1.3 tinha CVE conhecido** (bypass de autorização via middleware) — a própria Vercel recusou o deploy. Atualizado para `15.5.20`.
  3. **Prisma "perdia" o query engine no bundle da Vercel** (monorepo pnpm + tracing de serverless function) — corrigido com o plugin oficial `@prisma/nextjs-monorepo-workaround-plugin` (só ativo com `VERCEL=1`, não afeta o Docker/VPS).

### Auditoria de segurança + 3 gaps corrigidos — commit `9e5497c`
- **Injeção de HTML armazenada nos e-mails**: `templates.ts` interpolava `clientName`/`artistName` (definidos pelo próprio usuário no cadastro, sem sanitização) direto na string HTML sem escapar. `escapeHtml()` aplicado nos 4 templates + teste comprovando (nome `<script>...</script>` sai escapado no HTML enviado).
- **Rate limiting incompleto**: 12 Server Actions sem limite (agendamento, pagamento, simulação, artista, conta/LGPD, estúdio, notificação) agora usam `enforceRateLimit`, calibrado por risco. A rota do better-auth usava limitador em memória (não funciona com múltiplas instâncias) — trocado para `rateLimit.storage="database"` (nova tabela `RateLimit`, fora do RLS — não é multi-tenant, igual `User`/`Session`).
- **Segredos parciais sem validação no boot**: `env.ts` agora falha no boot se só metade do par Stripe estiver configurada (antes só quebrava na primeira tentativa de webhook em produção); `RESEND_API_KEY`/`EMAIL_FROM` passam a ser reconhecidas no schema.
- Áreas auditadas e já sólidas (sem gap): authN/authZ central (`getActor`/`requireActor` + reforço no domínio), isolamento multi-tenant (extensão Prisma + RLS), validação de input (`parseInput` na camada de domínio), assinatura do webhook Stripe, magic-bytes no upload, CSRF (Server Actions + `sameOrigin` na única rota de API mutável), headers de segurança/CSP.

### Fluxo de materialização testado ponta a ponta + 2 bugs corrigidos — commit `f324b3f`
- Rodado o fluxo real completo (via automação de navegador, dois usuários logados simultaneamente): orçamento → aceite → sinal → arte enviada → arte aprovada → foto do corpo → editor de posicionamento (gesto de arrastar + sliders de tamanho/rotação) → geração da simulação → aprovação. **O editor de gestos funciona corretamente** (drag de 1 ponteiro, matemática de pinça para 2 dedos) — nenhum bug na lógica de posicionamento.
- **Achado 1**: quando o provider de IA falha, o pedido volta de `SIMULATING` pra `AWAITING_BODY_PHOTO` silenciosamente — o motivo (`Simulation.errorMessage`) já era gravado no banco mas nunca chegava à tela do cliente. `ClientSimulationSection` agora mostra um banner com o motivo, tanto na tela de upload quanto no editor.
- **Achado 2**: `.env.example` trazia `AI_SIMULATION_PROVIDER=fal` como padrão — sem `FAL_API_KEY`, isso quebra a simulação real dentro do pedido (diferente do `/simular` público, que não depende disso). Trocado o padrão pra `mock` (que já existia e funciona out-of-the-box).
- **Achado à parte (ambiente, não código)**: `apps/web/.env.local` (esquecido da sessão de deploy Vercel/Neon) sobrescrevia o `DATABASE_URL` local silenciosamente — Next.js prioriza `.env.local` sobre `.env`. Arquivo restaurado como estava; decisão de removê-lo fica com o usuário (ver Notas operacionais).

### Bug crítico de RLS + auditoria visual completa — commits `9e352dc`, `17527a4`
- **`getActor()` lia `StudioMember` sem contexto de tenant/admin** — tabela protegida por RLS, então a política nunca casava e a consulta voltava vazia sempre, mesmo com memberships reais. Efeito: donos de estúdio ficavam com o painel idêntico ao de cliente comum, `/estudio/{id}/tatuadores` dava 404. Nunca apareceu porque o dev local usa role que ignora RLS. Fix: `withAdmin()` (seguro — o filtro já é pelo próprio `userId`).
- Auditoria visual com screenshots reais (Playwright) das 18 telas do produto (marketing, auth, dashboards de cliente/dono/tatuador/admin, perfis públicos). Achado: o redesign "Ateliê de Tinta" já estava consistente em quase tudo — só 2 lacunas reais, ambas corrigidas:
  1. `/s/{slug}` (perfil público do estúdio) dizia "Portfólio em breve" mesmo com dados reais → agora mostra equipe (`StudioTeam`) + galeria combinada do portfólio (`StudioPortfolio`), com leituras cacheadas dedicadas em `public-cache.ts`.
  2. `/painel` parecia genérico pra todo mundo (era o bug de RLS acima) → com o fix, título dinâmico por papel (admin/dono/tatuador/cliente) + botão "Meu perfil" pro tatuador puro (antes só via "Ver página" do estúdio, sem atalho pro próprio perfil).
- **Limitação conhecida:** só o `web` roda na Vercel. Chat e simulação em tempo real (Socket.IO) não conectam nesse ambiente — normal, é só para testar a landing/cadastro/`/simular`. Produção de verdade continua sendo a VPS (`docs/DEPLOY.md`).

---

## 🔌 Pronto para ATIVAR (só configurar env — código já existe)

| O quê | Como ativar |
|---|---|
| **Login social Google** | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (redirect URI: `${BETTER_AUTH_URL}/api/auth/callback/google`) |
| **IA real de simulação** (Fal, Flux) | `FAL_API_KEY` + `AI_SIMULATION_PROVIDER=fal` (dev local usa `mock` por padrão — funciona sem chave) |
| **IA real de simulação** (Stability, Stable Diffusion) | `STABILITY_API_KEY` + `AI_SIMULATION_PROVIDER=stability` — segundo provider real (12/07/2026), família de modelo diferente da Fal pra redundância |
| **Pagamentos reais** (Stripe) | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_<PLANO>` |
| **Redis** (rate limit distribuído, fila BullMQ, adapter realtime) | `REDIS_URL` |
| **E-mails transacionais** (orçamento, agendamento, lembrete de sessão) | `RESEND_API_KEY` (+ `EMAIL_FROM` opcional) |
| **Observabilidade** (Sentry) | `SENTRY_DSN` |

---

## 🟡 O QUE FALTA (backlog priorizado p/ amanhã)

### Alta prioridade (maior impacto)
1. ~~**Ligar a prova social a dados reais.**~~ ✅ Feito (ver seção acima).
2. ~~**Login social Google de verdade.**~~ ✅ Código pronto: `socialProviders.google` condicional a env + account linking confiável (mesmo e-mail). Verificado: sem env → toast "em breve"; com env → redirect OAuth (PKCE). **Falta só criar as credenciais no Google Cloud Console** (ver tabela "Pronto para ativar"). _Apple fica para depois (exige Apple Developer pago)._
3. ~~**`/simular` com IA real.**~~ ✅ Código pronto: com `FAL_API_KEY`, a página ganha o botão "Ver com IA real" — o cliente manda a composição (pele + arte posicionada) p/ `POST /api/simular` (rate limit 5/10min por IP, prompt fixo no server, resposta inline como data URI) e a Fal refina via img2img (`strength 0.5`). Antes/depois no palco; sem a chave, a página segue 100% client-side. `falImageToImage` extraído em `packages/ai` (compartilhado com o `FalProvider`). **Falta só a `FAL_API_KEY` real** (obs.: simulações públicas não entram no `AiUsageLog` — sem estúdio — então não contam na prova social).
4. **Deploy na VPS.** 🟢 Artefatos completos e revisados: Caddy na borda (TLS automático), `NEXT_PUBLIC_*` como build args (bug corrigido — antes o bundle sairia com `localhost`), `REDIS_URL` no realtime (adapter estava desligado em prod), runbook completo em `docs/DEPLOY.md` (passo a passo, swap p/ 2GB, verificação, updates, backup cron, troubleshooting). **Falta só executar na máquina**: VPS + domínio (2 registros A) + preencher `docker/.env.prod`.

### Média prioridade
5. ~~**Stripe Connect onboarding completo**~~ ✅ Port ganha `createAccountOnboardingLink` (refresh/return URLs) + `getAccountStatus` (charges_enabled/details_submitted); Stripe via `accountLinks.create`/`accounts.retrieve`, mock volta direto pra returnUrl. Use case agora **reusa a conta existente** (o fluxo antigo criava conta órfã no Stripe a cada clique) e a página `/planos` mostra o estado real: sem conta → "Conectar pagamentos" (redireciona ao Stripe); pendente → "Completar onboarding"; enviado → "Em análise"; ativa → "Conectada". +4 testes (53 no total), CI verde. Com `STRIPE_SECRET_KEY` real, funciona sem mudar código.
6. ~~**R2 real + verificação de magic-bytes**~~ ✅ `sniffMime` no core (17 testes — HTML/SVG disfarçados nunca passam); sink do mock valida no PUT; `R2StorageService` completo (S3/presigned PUT com Content-Type+tamanho assinados, readHead via Range) ativado por `R2_*` no env; `/api/uploads/verify` pós-upload APAGA do bucket conteúdo que não bate com os magic bytes. **Falta só criar o bucket R2** (grátis) e preencher as vars.
7. ~~**E-mails transacionais** (orçamento, agendamento) + **lembretes de sessão**~~ ✅ Port `EmailService` (`packages/core`) + adapters `ResendEmailService`/`MockEmailService` (o mock só loga — sem `RESEND_API_KEY` nada quebra). `SendQuoteUseCase`, `ScheduleSessionUseCase` e `RescheduleSessionUseCase` mandam e-mail ao cliente (best-effort — falha do provedor não desfaz a transição já persistida). Lembrete de sessão: novo campo `Appointment.reminderSentAt`, `SendSessionRemindersUseCase` varre agendamentos nas próximas 24h ainda não avisados (leitura/escrita cross-tenant via `withAdmin`, mesmo padrão do `PrismaMetricsRepository`) — o `apps/worker` agenda essa varredura a cada 15min via BullMQ Job Scheduler (só ativo com `REDIS_URL`; sem Redis, sem lembretes — igual ao dev dos outros jobs). **Falta só a `RESEND_API_KEY` real** (e o worker rodando, ou seja, a VPS — não funciona no deploy de teste da Vercel).
8. ~~**Rodar o E2E no CI.**~~ ✅ Job `e2e` no GitHub Actions rodando o **caminho de produção**: Postgres 16 real → `prisma migrate deploy` + `prod-init.ts` (role `inkvision_app` + RLS) → seed → build de produção → Playwright (chromium + mobile) com o app **conectado com o role RLS** — o cenário que pegaria a migration inválida e o bug do `getActor`. Suíte atualizada pro redesign (estava quebrada) + `E2E_BASE_URL` para rodar contra qualquer ambiente no ar (validado: 16/16 contra a Vercel). De brinde, 2 fixes que destravavam TODO o CI: conflito de versão do pnpm (action vs `packageManager`) e `REALTIME_EMIT_SECRET` no build de produção. **Verificado verde no Actions** (run `28814951873`: ci 1m56s ✓ · e2e 2m48s ✓).
9. ~~**ISR estático real**~~ ✅ `/t` e `/s` são SSG/ISR (revalidate 5min, generateStaticParams vazio — geram na 1ª visita): sessão+likes hidratam no cliente via `getViewerPortfolioStateAction`; prévia de estúdio não publicado saiu para `/s/{slug}/previa` (dinâmica, noindex). Comprovado em produção: X-Vercel-Cache MISS→HIT.

### Baixa prioridade / polimento
10. ~~Mais desenhos no `/simular`~~ ✅ 10 desenhos (era 5): +âncora, rosa, borboleta, raio e lettering "amor" — ecoando o flash old school do fundo do site.
11. ~~Paginação das mensagens do chat~~ ✅ Cursor para trás (MessagePage no port; conversa abre nas 50 mais recentes — o antigo asc+take(200) TRUNCAVA as novas em conversa longa — e "Carregar anteriores" preserva a rolagem). **De fora com justificativa:** cache Redis de leitura (só compensa com 2+ instâncias do web — revisitar na VPS) e i18n (projeto próprio; só pt-BR por ora).

---

## ⚙️ Notas operacionais (para o dev local)
- **NÃO rodar `next build` com `pnpm dev` no ar** — os dois escrevem em `apps/web/.next` e corrompem o dev (500 em tudo). Pare o dev + `rm -rf apps/web/.next` antes de buildar.
- **`prisma dev` instável** entre comandos isolados — inclusive caiu **várias vezes durante uma sessão de teste real** (não só entre comandos isolados). Subir o banco com `pnpm setup:local` (tem retry); se falhar 2×, recriar manualmente (`npx prisma dev rm inkvision --force && npx prisma dev -d --name inkvision`, esperar ~12s, depois `pnpm setup:local` de novo).
- Rodar tudo: `pnpm setup:local` (1ª vez) + `pnpm dev` (web :3000, realtime :4000, worker).
- Contas demo (senha `inkvision123`): `cliente@` · `rafa@` (tatuador) · `alma@` (dono) · `admin@` `@inkvision.app`.
- **`apps/web/.env.local`, se existir, sobrescreve o `DATABASE_URL` do `.env` silenciosamente** (Next.js prioriza `.env.local`) — se alguém deixou credenciais do Neon lá (da sessão de deploy de teste), o dev local conecta no banco remoto sem avisar. Confira `cat apps/web/.env.local` antes de desconfiar do banco local; se não precisa mais dele, apague.
- Sem `REDIS_URL`, o rate limit cai pro fallback em memória — **mas se a env var estiver setada e não houver Redis rodando** (ex.: sem `pnpm infra:up`), cada chamada tenta reconectar e falha, gerando ruído e lentidão real. Comente `REDIS_URL` no `.env` se não for usar `infra:up`.
- O `standalone` do Next não faz build no Windows (EPERM symlink) — irrelevante, funciona no Docker/CI Linux.
