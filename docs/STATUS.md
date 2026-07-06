# InkVision — Estado atual & o que falta

_Última atualização: sessão de redesign + simulador público. Commit de referência: `396193a`._
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

---

## 🔌 Pronto para ATIVAR (só configurar env — código já existe)

| O quê | Como ativar |
|---|---|
| **Login social Google** | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` (redirect URI: `${BETTER_AUTH_URL}/api/auth/callback/google`) |
| **IA real de simulação** (Fal) | `FAL_API_KEY` + `AI_SIMULATION_PROVIDER=fal` |
| **Pagamentos reais** (Stripe) | `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` + `STRIPE_PRICE_<PLANO>` |
| **Redis** (rate limit distribuído, fila BullMQ, adapter realtime) | `REDIS_URL` |
| **Observabilidade** (Sentry) | `SENTRY_DSN` |

---

## 🟡 O QUE FALTA (backlog priorizado p/ amanhã)

### Alta prioridade (maior impacto)
1. ~~**Ligar a prova social a dados reais.**~~ ✅ Feito (ver seção acima).
2. ~~**Login social Google de verdade.**~~ ✅ Código pronto: `socialProviders.google` condicional a env + account linking confiável (mesmo e-mail). Verificado: sem env → toast "em breve"; com env → redirect OAuth (PKCE). **Falta só criar as credenciais no Google Cloud Console** (ver tabela "Pronto para ativar"). _Apple fica para depois (exige Apple Developer pago)._
3. **`/simular` com IA real (opcional).** Hoje é prévia por sobreposição (blend). Fazer a página pública chamar o `FalProvider` quando `FAL_API_KEY` existir — "wow" ainda maior na landing.
4. **Deploy na VPS.** Artefatos Docker prontos (`docker/`, `compose.prod.yml`, migration inicial, `prod-init.ts` cria o role não-superusuário). Falta rodar na máquina + preencher `docker/.env.prod`.

### Média prioridade
5. **Stripe Connect onboarding completo** (account link + retorno) — hoje `connectStudio` cria a conta mas falta o fluxo de onboarding.
6. **R2 real + verificação de magic-bytes** no upload (hoje storage mockado; presign valida só o MIME declarado).
7. **E-mails transacionais** (orçamento, agendamento) + **lembretes de sessão**.
8. **Rodar o E2E no CI.** Suíte Playwright existe (`apps/web/e2e/`); falta subir DB semeado no workflow.
9. **ISR estático real** nas páginas públicas `/t` e `/s` (hoje leitura cacheada, mas dinâmicas por causa do `getActor`/like-state — exige mover a parte autenticada p/ client).

### Baixa prioridade / polimento
10. Mais desenhos no `/simular` (lettering, etc.) e reação da página enquanto digita.
11. Paginação das mensagens do chat · cache Redis compartilhado de leitura (hoje `unstable_cache` in-memory por instância) · i18n (só pt-BR).

---

## ⚙️ Notas operacionais (para o dev local)
- **NÃO rodar `next build` com `pnpm dev` no ar** — os dois escrevem em `apps/web/.next` e corrompem o dev (500 em tudo). Pare o dev + `rm -rf apps/web/.next` antes de buildar.
- **`prisma dev` instável** entre comandos isolados. Subir o banco com `pnpm setup:local` (tem retry); se falhar 2×, recriar manualmente (`npx prisma dev rm inkvision --force && npx prisma dev -d --name inkvision`, esperar ~12s, depois `db push` + `apply-rls` + `seed:demo`).
- Rodar tudo: `pnpm setup:local` (1ª vez) + `pnpm dev` (web :3000, realtime :4000, worker).
- Contas demo (senha `inkvision123`): `cliente@` · `rafa@` (tatuador) · `alma@` (dono) · `admin@` `@inkvision.app`.
- O `standalone` do Next não faz build no Windows (EPERM symlink) — irrelevante, funciona no Docker/CI Linux.
