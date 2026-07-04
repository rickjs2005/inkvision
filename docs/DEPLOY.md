# Deploy — InkVision (VPS + Docker / Coolify)

Três processos (`web`, `realtime`, `worker`) + Postgres + Redis. Storage (R2),
pagamentos (Stripe) e IA são plugáveis: sem chaves, rodam mockados.

## Arquivos

- `docker/web.Dockerfile` · `docker/realtime.Dockerfile` · `docker/worker.Dockerfile`
- `docker/migrate.Dockerfile` — job de init (migrations + role do app + RLS)
- `docker/compose.prod.yml` — orquestra tudo
- `docker/.env.prod.example` — modelo dos segredos

## Segurança do banco (importante)

O init cria o role **`inkvision_app` (NÃO-superusuário)** e o app conecta com ele —
é isso que faz o **RLS valer** em produção. O superusuário (`postgres`) é usado só
pelo job de migração. As duas senhas (`POSTGRES_PASSWORD` e `APP_DB_PASSWORD`) ficam
no `docker/.env.prod`.

## Opção A — Docker Compose (VPS simples)

```bash
git clone https://github.com/rickjs2005/inkvision.git && cd inkvision
cp docker/.env.prod.example docker/.env.prod    # e preencha os segredos
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d --build
```

Ordem automática: `postgres`/`redis` sobem → `migrate` roda (migrations+role+RLS) e sai
→ `web` (:3000), `realtime` (:4000) e `worker` sobem. Coloque um reverse proxy
(Caddy/Traefik/Nginx) na frente para TLS e para expor `web` no domínio e `realtime`
num subdomínio (WebSocket).

## Opção B — Coolify

No Coolify, crie um recurso **Docker Compose** apontando para `docker/compose.prod.yml`
(ou crie os serviços individualmente usando cada Dockerfile). Passos:

1. **Recursos gerenciados:** crie um Postgres e um Redis no Coolify (ou use os do compose).
2. **Variáveis de ambiente:** cole o conteúdo do `.env.prod` nas envs do projeto.
3. **Domínios:** aponte o domínio principal para o serviço `web` (porta 3000) e um
   subdomínio para o `realtime` (porta 4000, com WebSocket habilitado). Ajuste
   `APP_URL` e `REALTIME_PUBLIC_URL`.
4. **Build:** cada serviço usa seu Dockerfile (contexto = raiz do repo).
5. **Deploy:** o Coolify constrói e sobe. O job `migrate` roda o init do banco.
6. **Multi-tenant por subdomínio:** configure um wildcard `*.seu-dominio` apontando
   para o `web` (o middleware resolve `{slug}.dominio`).

## Depois do primeiro deploy

- **Admin:** o seed de produção NÃO roda automaticamente. Crie sua conta em `/cadastro`
  e promova para admin uma vez (`UPDATE "User" SET "platformRole"='ADMIN' WHERE email=...`).
- **Trocar os mocks por real:** basta preencher as chaves no `.env.prod`
  (`AI_SIMULATION_PROVIDER=fal` + `FAL_API_KEY`, chaves do R2, chaves do Stripe) e
  redeploy — nenhum código muda.
- **Webhook do Stripe:** aponte para `https://SEU_DOMINIO/api/webhooks/stripe` quando
  ligar o Stripe real (handler a implementar no lugar do confirm mockado).

## Notas

- **Rate limit** hoje é em memória (ok p/ 1 instância do `web`). Com várias instâncias,
  troque o store por Redis (`src/server/rate-limit.ts`).
- **Prisma engine:** as imagens usam Debian slim e `binaryTargets` já inclui
  `debian-openssl-3.0.x`. Se aparecer erro de engine no `web`, copie `node_modules/.prisma`
  para dentro do standalone no Dockerfile (fallback).
- **Build local no Windows:** `next build` (com `output: standalone`) falha no passo
  final de cópia por causa de symlinks (EPERM) — é uma limitação do Windows sem admin.
  A compilação em si passa; o standalone é gerado normalmente no container Linux. Para
  testar localmente no Windows, use `pnpm dev` (não precisa de build).
- Ver também `docs/SECURITY.md`.
