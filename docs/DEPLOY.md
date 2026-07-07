# Deploy — InkVision (VPS + Docker / Coolify)

Stack no `docker/compose.prod.yml`: Postgres 16 · Redis 7 · `migrate` (job
one-shot: migrations + role do app + RLS) · `web` (Next standalone) ·
`realtime` (Socket.IO) · `worker` (BullMQ) · **Caddy** na borda com TLS
automático (Let's Encrypt). Storage (R2), pagamentos (Stripe) e IA são
plugáveis: sem chaves, rodam mockados.

## Arquivos

- `docker/web.Dockerfile` · `docker/realtime.Dockerfile` · `docker/worker.Dockerfile`
- `docker/migrate.Dockerfile` — job de init (migrations + role do app + RLS)
- `docker/compose.prod.yml` — orquestra tudo · `docker/Caddyfile` — borda/TLS
- `docker/.env.prod.example` — modelo dos segredos

## Segurança do banco (importante)

O init cria o role **`inkvision_app` (NÃO-superusuário)** e o app conecta com ele —
é isso que faz o **RLS valer** em produção. O superusuário (`postgres`) é usado só
pelo job de migração. As duas senhas (`POSTGRES_PASSWORD` e `APP_DB_PASSWORD`) ficam
no `docker/.env.prod`.

## Opção A — Docker Compose (VPS simples)

### 0. Pré-requisitos

- VPS Linux (Ubuntu 22.04+), **mínimo 2 GB de RAM** — o build do Next na
  própria VPS consome ~2 GB; em máquina de 2 GB, adicione swap (passo 2).
- Domínio com dois registros **A** apontando para o IP da VPS:
  `seu-dominio` (app) e `rt.seu-dominio` (realtime).
- Portas **80 e 443** liberadas no firewall/painel do provedor.

### 1. Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # relogue depois
```

### 2. (VPS de 2 GB) Swap para o build

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 3. Clonar e configurar

```bash
git clone https://github.com/rickjs2005/inkvision.git && cd inkvision
cp docker/.env.prod.example docker/.env.prod
```

No `docker/.env.prod`: URLs/domínios (`APP_URL`, `ROOT_DOMAIN`,
`REALTIME_PUBLIC_URL`, `APP_DOMAIN`, `RT_DOMAIN`) e segredos — gere cada um
com `openssl rand -base64 32` (`POSTGRES_PASSWORD`, `APP_DB_PASSWORD`,
`BETTER_AUTH_SECRET`, `REALTIME_EMIT_SECRET`). Chaves opcionais (Google,
Stripe, R2, Fal) podem ficar vazias e entrar depois.

> Sem domínio ainda? `APP_DOMAIN=http://SEU-IP` faz o Caddy servir HTTP puro
> para um teste rápido. Login social e webhooks exigem domínio + HTTPS.

### 4. Subir

```bash
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d --build
```

Ordem automática: `postgres`/`redis` → `migrate` (roda e sai) → `web`,
`realtime`, `worker` → `caddy` publica 80/443.

### 5. Verificar

```bash
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod ps
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod logs migrate
curl -I https://SEU-DOMINIO                                            # 200
curl "https://rt.SEU-DOMINIO/socket.io/?EIO=4&transport=polling"       # resposta Socket.IO
```

No navegador: home → cadastro → login → `/simular` → abrir um chat (realtime).

### 6. Atualizar (novas versões)

```bash
git pull
docker compose -f docker/compose.prod.yml --env-file docker/.env.prod up -d --build
docker image prune -f
```

O `migrate` reaplica migrations pendentes a cada `up`.

### 7. Backup diário do banco (cron)

```cron
# /etc/cron.d/inkvision-backup — 03:15, mantém 14 dias
15 3 * * * root docker compose -f /caminho/inkvision/docker/compose.prod.yml --env-file /caminho/inkvision/docker/.env.prod exec -T postgres pg_dump -U postgres inkvision | gzip > /var/backups/inkvision-$(date +\%F).sql.gz && find /var/backups -name 'inkvision-*.sql.gz' -mtime +14 -delete
```

## Opção B — Coolify

No Coolify, crie um recurso **Docker Compose** apontando para `docker/compose.prod.yml`
(ou crie os serviços individualmente usando cada Dockerfile). Passos:

1. **Recursos gerenciados:** crie um Postgres e um Redis no Coolify (ou use os do compose).
2. **Variáveis de ambiente:** cole o conteúdo do `.env.prod` nas envs do projeto.
3. **Domínios:** aponte o domínio principal para o serviço `web` (porta 3000) e um
   subdomínio para o `realtime` (porta 4000, com WebSocket habilitado). Ajuste
   `APP_URL` e `REALTIME_PUBLIC_URL`. O Coolify já faz TLS — nesse caso remova o
   serviço `caddy` do compose (ou use os Dockerfiles individuais).
4. **Build:** cada serviço usa seu Dockerfile (contexto = raiz do repo).
   **Importante:** `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_REALTIME_URL` são **build
   args** do `web.Dockerfile` (inlined no bundle) — configure-as como build args,
   não só como env de runtime.
5. **Deploy:** o Coolify constrói e sobe. O job `migrate` roda o init do banco.

## Depois do primeiro deploy

- **Admin:** o seed de produção NÃO roda automaticamente. Crie sua conta em `/cadastro`
  e promova uma vez:

  ```bash
  docker compose -f docker/compose.prod.yml --env-file docker/.env.prod \
    exec postgres psql -U postgres -d inkvision \
    -c "UPDATE \"User\" SET \"platformRole\"='ADMIN' WHERE email='voce@exemplo.com';"
  ```

- **Trocar os mocks por real:** preencha as chaves no `.env.prod`
  (`AI_SIMULATION_PROVIDER=fal` + `FAL_API_KEY`, R2, Stripe, Google, `RESEND_API_KEY`)
  e rode o passo 6 (o `--build` importa: parte é inlined no build).
- **Webhook do Stripe:** aponte para `https://SEU_DOMINIO/api/webhooks/stripe`.
- **Subdomínios de estúdio (`{slug}.dominio`) — opcional:** o caminho canônico é
  `/s/{slug}` e funciona sem nada extra. Para servir subdomínios com TLS, o Caddy
  precisa de certificado wildcard (desafio DNS — exige plugin do seu provedor de
  DNS); alternativa: Cloudflare na frente com wildcard proxied.

## Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Caddy não emite certificado | DNS não propagou para o IP, ou 80/443 fechadas |
| Build do `web` morre (OOM) | Sem swap em VPS de 2 GB — passo 2 |
| Chat/simulação não conecta | `REALTIME_PUBLIC_URL`/`RT_DOMAIN` errados — o valor é **inlined no build**; corrigiu? rode `up -d --build` de novo |
| `migrate` falha após 1º deploy | Senhas mudaram com o volume `pgdata` antigo — o Postgres guarda as senhas originais |
| Erro de engine do Prisma no `web` | Imagens usam Debian slim e `binaryTargets` já inclui `debian-openssl-3.0.x`; se ocorrer, copie `node_modules/.prisma` para dentro do standalone no Dockerfile (fallback) |

## Notas

- **Rate limit** usa Redis automaticamente quando `REDIS_URL` existe (o compose já
  injeta) — seguro para múltiplas instâncias do `web`.
- **Build local no Windows:** `next build` (com `output: standalone`) falha no passo
  final de cópia por causa de symlinks (EPERM) — limitação do Windows sem admin.
  A compilação em si passa; o standalone é gerado normalmente no container Linux. Para
  testar localmente no Windows, use `pnpm dev` (não precisa de build).
- Ver também `docs/SECURITY.md`.
