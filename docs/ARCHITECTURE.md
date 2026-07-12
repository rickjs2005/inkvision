# InkVision — Blueprint de Arquitetura

> SaaS multi-tenant para estúdios de tatuagem: descoberta de artistas, briefing, orçamento, chat, arte, simulação por IA na foto do cliente, agendamento e pagamentos.
> Documento de referência — aprovado antes do início da implementação. Nenhum sprint começa sem este documento estar validado.

---

## 1. Arquitetura Completa

### 1.1 Visão geral

Monorepo TypeScript (pnpm workspaces + Turborepo) com quatro processos em produção, todos containerizados e orquestrados pelo Coolify numa VPS Linux:

```
                            ┌─────────────────────────────────────────────────┐
                            │                  VPS (Coolify)                  │
                            │                                                 │
 Browser / PWA ── HTTPS ──► │  ┌────────────────┐        ┌─────────────────┐  │
 {slug}.inkvision.app       │  │ apps/web       │───────►│ PostgreSQL 16   │  │
                            │  │ Next.js 15     │        │ (RLS + Prisma)  │  │
                            │  │ SSR + API      │        └─────────────────┘  │
                            │  └───────┬────────┘        ┌─────────────────┐  │
 Browser ──── WSS ────────► │  ┌───────▼────────┐        │ Redis 7         │  │
                            │  │ apps/realtime  │◄──────►│ cache · pub/sub │  │
                            │  │ Socket.IO      │        │ · filas BullMQ  │  │
                            │  └────────────────┘        └────────┬────────┘  │
                            │  ┌────────────────┐                 │           │
                            │  │ apps/worker    │◄────────────────┘           │
                            │  │ BullMQ (IA,    │                             │
                            │  │ e-mail, mídia) │                             │
                            │  └───────┬────────┘                             │
                            └──────────┼─────────────────────────────────────-┘
                                       ▼
                 Cloudflare R2 (mídia) · Stripe (Billing + Connect) ·
                 Provedores de IA (Fal.ai / Replicate / OpenAI / Gemini / Flux / SD)
```

| Processo | Responsabilidade |
|---|---|
| `apps/web` | Next.js 15 (App Router, React 19). SSR/ISR das páginas públicas, API Routes (REST), Server Actions para mutações internas, middleware de tenant e auth. |
| `apps/realtime` | Socket.IO com adapter Redis. Chat, indicador "digitando", confirmação de leitura, notificações push in-app, progresso de jobs de IA. |
| `apps/worker` | BullMQ. Jobs assíncronos: geração de simulação por IA, processamento de mídia (thumbnails, transcode), e-mails, lembretes de agendamento. |
| PostgreSQL | Banco único, schema compartilhado, isolamento por `studioId` + Row-Level Security. |
| Redis | Cache de leitura (perfis, busca), pub/sub (web → realtime), filas BullMQ, rate limiting. |

### 1.2 Decisões técnicas e justificativas

1. **Next.js API Routes em vez de NestJS.** Um único runtime elimina duplicação de tipos, simplifica deploy e reduz latência (Server Actions + RSC). A regra de negócio fica **fora** do Next — em `packages/core` (use cases puros) — então migrar a borda HTTP para NestJS no futuro não toca o domínio.
2. **Better Auth** (em vez de Auth.js): plugin `organization` resolve membership multi-tenant nativamente, sessões em banco, 2FA, admin API. Roles: `ADMIN` (plataforma) e, por estúdio, `OWNER | MANAGER | ARTIST`; cliente é usuário sem membership.
3. **Multi-tenancy: banco único, coluna `studioId`, três camadas de defesa.**
   - *Camada 1:* Prisma Client Extension que exige `studioId` em toda query de modelo tenant-scoped (query sem tenant lança erro em dev e é bloqueada em prod).
   - *Camada 2:* Postgres RLS (`SET app.current_studio_id`) como defesa em profundidade — mesmo um bug na aplicação não vaza dados entre estúdios.
   - *Camada 3:* testes de isolamento automatizados (suíte que tenta cross-tenant em toda rota).
   - Roteamento: subdomínio `{slug}.inkvision.app` resolvido no middleware, com fallback path-based `/s/{slug}` para dev/preview.
4. **Realtime como serviço separado** (não dentro do Next): WebSockets de longa duração não convivem bem com o modelo serverless/edge do Next; um processo Socket.IO dedicado com Redis adapter escala horizontalmente e o Next publica eventos via pub/sub.
5. **IA assíncrona por fila.** Geração de simulação leva 10–60s; a API enfileira (BullMQ), o worker chama o provider e o resultado chega ao cliente por WebSocket. Nada de request HTTP pendurado.
6. **Stripe em dois eixos.**
   - *SaaS:* Stripe Billing — assinatura do estúdio (planos Starter/Pro/Enterprise com limites de artistas e créditos de IA).
   - *Marketplace:* Stripe Connect (destination charges) — cliente paga sinal/final, o estúdio recebe na conta conectada, a plataforma retém `application_fee`.
7. **Clean Architecture / SOLID.** Dependências apontam para dentro:
   ```
   presentation (routes, actions, components)
        ↓ chama
   application (use cases, DTOs zod, ports/interfaces)
        ↓ orquestra
   domain (entidades, state machines, regras puras — zero dependência externa)
        ↑ implementado por
   infrastructure (Prisma repos, R2, Stripe, providers de IA, Redis)
   ```
   Repository Pattern em todos os agregados; use cases recebem repositórios e gateways por injeção (container leve, sem framework de DI pesado).
8. **Camada de IA plugável** (detalhe na seção 1.3).
9. **Segurança transversal:** rate limit (Redis sliding window por IP+rota+tenant), CSRF (tokens em mutações não-Server-Action), sanitização de HTML (chat/briefing), validação zod em toda borda, headers via middleware (CSP estrita, HSTS, X-Frame-Options, Permissions-Policy), uploads só via presigned URL com validação de MIME/tamanho e verificação de magic bytes no worker, criptografia de PII sensível em repouso, trilha de auditoria (`AuditLog`), LGPD (export e exclusão de dados do titular, consentimento registrado).

### 1.3 Camada de IA (provider-agnostic)

```
packages/ai
├── core/
│   ├── ports.ts            # interfaces — o resto do sistema SÓ conhece isto
│   │     TattooSimulationProvider.simulate(input): Promise<SimulationResult>
│   │     ImageGenerationProvider.generate(prompt, opts)
│   │     SkinSegmentationProvider.segment(photo)
│   ├── pipeline.ts         # orquestra: segmentar pele → estimar perspectiva/curvatura
│   │                       # → warp do desenho → harmonizar luz/sombra/textura → compor
│   └── registry.ts         # factory por env: AI_SIMULATION_PROVIDER=fal|replicate|...
├── providers/
│   ├── fal.ts              # Fal.ai (Flux inpaint/img2img)
│   ├── replicate.ts        # Replicate (SDXL inpaint, ControlNet)
│   ├── openai.ts           # gpt-image edit
│   ├── gemini.ts           # Gemini image
│   └── stability.ts        # Stability AI (Stable Diffusion, inpaint com máscara real) — 2º provider real, 12/07/2026
└── prompts/                # templates versionados de prompt por operação
```

- Trocar de provider = trocar uma env var. Nenhum use case importa provider concreto.
- Cada chamada grava `AiUsageLog` (provider, operação, custo) → alimenta dashboard admin e limites de plano.
- Pipeline da simulação: detectar pele/parte do corpo → máscara → estimar perspectiva → aplicar desenho com warp (escala P/M/G + posição escolhida pelo cliente) → img2img de baixa intensidade para integrar sombras, textura e iluminação preservando o desenho.

### 1.4 Cache e performance

- Redis: perfis públicos de artista/estúdio (TTL 5 min, invalidação por evento), resultados de busca, contadores (likes, unread).
- Next: ISR nas páginas públicas (home, perfil, galeria), `revalidateTag` por entidade.
- Imagens: R2 + `next/image` com loader custom, AVIF/WebP, blur placeholder.
- Meta: Lighthouse ≥ 95 (verificado em CI a partir da Sprint 3).

---

## 2. Estrutura de Pastas

```
inkvision/
├── apps/
│   ├── web/                              # Next.js 15
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/          # home, /estudios, /tatuadores, /estilos/[slug]
│   │   │   │   ├── (auth)/               # login, cadastro, recuperação
│   │   │   │   ├── (client)/painel/      # pedidos, mensagens, pagamentos, agenda,
│   │   │   │   │                         # favoritos, simulações, downloads, perfil
│   │   │   │   ├── (studio)/estudio/     # dashboard dono: artistas, agenda, pedidos,
│   │   │   │   │                         # financeiro, configurações
│   │   │   │   ├── (artist)/artista/     # pedidos, agenda, chat, portfólio, stats
│   │   │   │   ├── (admin)/admin/        # estúdios, planos, métricas, logs, usuários
│   │   │   │   ├── s/[slug]/             # página pública do estúdio (fallback path)
│   │   │   │   └── api/                  # REST: webhooks stripe, uploads, ai, cron
│   │   │   ├── components/               # ui/ (shadcn) · features/ (por domínio)
│   │   │   ├── lib/                      # auth client, tenant resolver, utils
│   │   │   ├── middleware.ts             # tenant por subdomínio + guarda de sessão
│   │   │   └── styles/
│   │   └── next.config.ts
│   ├── realtime/                         # Socket.IO + Redis adapter
│   │   └── src/ (gateway, auth de socket, rooms por conversa/tenant)
│   └── worker/                           # BullMQ consumers
│       └── src/jobs/ (simulate-tattoo, process-media, send-email, reminders)
├── packages/
│   ├── core/                             # ★ domínio + aplicação (puro, sem IO)
│   │   ├── domain/ (entities, value-objects, order-state-machine, errors)
│   │   └── application/ (use-cases/ por módulo, dtos/ zod, ports/ interfaces)
│   ├── db/                               # Prisma schema, migrations, seed,
│   │   └── tenant-extension.ts           # client extension multi-tenant
│   ├── ai/                               # camada de IA (seção 1.3)
│   ├── config/                           # eslint, tsconfig, tailwind preset
│   └── shared/                           # tipos, constantes, i18n, eventos ws
├── docker/ (Dockerfiles por app, compose.dev.yml)
├── docs/ (este documento, ADRs, runbooks)
├── turbo.json · pnpm-workspace.yaml · .env.example
```

---

## 3. Modelagem do Banco (Prisma — modelos principais)

```prisma
// ── Identidade (Better Auth gerencia User/Session/Account/Verification) ──
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  emailVerified Boolean  @default(false)
  image         String?
  phone         String?
  platformRole  PlatformRole @default(USER)   // ADMIN | USER
  memberships   StudioMember[]
  createdAt     DateTime @default(now())
}

// ── Tenant ──
model Studio {
  id               String   @id @default(cuid())
  slug             String   @unique            // subdomínio
  name             String
  logoUrl          String?
  description      String?
  addressStreet    String?  addressCity String?  addressState String?
  addressZip       String?
  phone            String?
  socials          Json?                       // { instagram, tiktok, ... }
  openingHours     Json?                       // por dia da semana
  stripeAccountId  String?                     // Connect
  status           StudioStatus @default(PENDING) // PENDING|ACTIVE|SUSPENDED
  members          StudioMember[]
  subscription     Subscription?
  createdAt        DateTime @default(now())
}

model StudioMember {
  id        String     @id @default(cuid())
  studioId  String
  userId    String
  role      StudioRole                          // OWNER | MANAGER | ARTIST
  @@unique([studioId, userId])
}

// ── Artista ──
model ArtistProfile {
  id              String  @id @default(cuid())
  studioId        String
  userId          String  @unique
  bio             String?
  experienceYears Int?
  instagram       String?
  avgPriceCents   Int?
  avgResponseMin  Int?                          // cache calculado
  ratingAvg       Decimal? ratingCount Int @default(0)
  isActive        Boolean @default(true)
  styles          ArtistStyle[]
  portfolio       PortfolioItem[]
}

model Style      { id String @id; name String; slug String @unique }  // seed: fine-line, blackwork, ...
model ArtistStyle { artistId String; styleId String; @@id([artistId, styleId]) }

// ── Portfólio ──
model PortfolioItem {
  id          String   @id @default(cuid())
  studioId    String
  artistId    String
  type        MediaKind                          // IMAGE|VIDEO|BEFORE_AFTER
  mediaUrl    String
  beforeUrl   String?  afterUrl String?
  description String?
  tags        String[]
  styleId     String?
  likesCount  Int @default(0)
  createdAt   DateTime @default(now())
}
model PortfolioLike    { userId String; itemId String; @@id([userId, itemId]) }
model PortfolioComment { id String @id @default(cuid()); itemId String; userId String; body String; createdAt DateTime @default(now()) }

// ── Pedido (agregado central) ──
model Order {
  id               String      @id @default(cuid())
  studioId         String
  clientId         String
  artistId         String
  styleId          String?
  bodyPart         String
  approxSizeCm     Int?
  briefing         String
  status           OrderStatus @default(SUBMITTED)
  quoteAmountCents Int?  depositCents Int?  currency String @default("BRL")
  references       OrderReference[]
  designs          DesignVersion[]
  simulations      Simulation[]
  payments         Payment[]
  appointment      Appointment?
  review           Review?
  events           OrderEvent[]                  // histórico de status (auditoria)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@index([studioId, status])
}

enum OrderStatus {
  SUBMITTED  QUOTED  DEPOSIT_PENDING  DEPOSIT_PAID
  IN_DESIGN  DESIGN_REVIEW  CHANGES_REQUESTED  DESIGN_APPROVED
  AWAITING_BODY_PHOTO  SIMULATING  SIMULATION_REVIEW  SIMULATION_APPROVED
  SCHEDULED  COMPLETED  REVIEWED  CANCELLED  REFUNDED
}

model OrderReference { id String @id @default(cuid()); orderId String; fileUrl String; note String? }
model OrderEvent     { id String @id @default(cuid()); orderId String; actorId String?; from OrderStatus?; to OrderStatus; metadata Json?; createdAt DateTime @default(now()) }

model DesignVersion {
  id        String   @id @default(cuid())
  orderId   String
  version   Int
  imageUrl  String
  notes     String?
  status    DesignStatus @default(PENDING)      // PENDING|APPROVED|CHANGES_REQUESTED
  feedback  String?
  createdAt DateTime @default(now())
  @@unique([orderId, version])
}

// ── Simulação IA ──
model Simulation {
  id              String   @id @default(cuid())
  orderId         String
  designVersionId String
  bodyPhotoUrl    String
  placement       Json                            // { x, y, scale, rotation }
  variants        Json?                           // { small, medium, large } → URLs R2
  provider        String
  status          JobStatus @default(QUEUED)      // QUEUED|PROCESSING|DONE|FAILED
  errorMessage    String?
  createdAt       DateTime @default(now())
}

// ── Chat ──
model Conversation {
  id        String   @id @default(cuid())
  studioId  String
  orderId   String?  @unique
  clientId  String
  artistId  String
  messages  Message[]
  @@index([studioId, clientId])
}
model Message {
  id             String    @id @default(cuid())
  conversationId String
  senderId       String
  kind           MessageKind                      // TEXT|AUDIO|IMAGE|PDF|VIDEO|SYSTEM
  body           String?
  attachmentUrl  String?   attachmentMeta Json?
  deliveredAt    DateTime? readAt DateTime?
  createdAt      DateTime  @default(now())
  @@index([conversationId, createdAt])
}

// ── Agenda ──
model AvailabilityRule { id String @id @default(cuid()); artistId String; weekday Int; startMin Int; endMin Int }
model TimeOff          { id String @id @default(cuid()); artistId String; startsAt DateTime; endsAt DateTime; reason String? }
model Appointment {
  id        String   @id @default(cuid())
  studioId  String   orderId String @unique
  artistId  String   clientId String
  startsAt  DateTime endsAt DateTime
  status    AppointmentStatus @default(CONFIRMED) // CONFIRMED|RESCHEDULED|DONE|NO_SHOW|CANCELLED
  @@index([artistId, startsAt])
}

// ── Financeiro ──
model Payment {
  id                    String  @id @default(cuid())
  studioId              String  orderId String
  kind                  PaymentKind                // DEPOSIT | FINAL
  amountCents           Int     feeCents Int       // application fee da plataforma
  stripePaymentIntentId String  @unique
  status                PaymentStatus @default(PENDING) // PENDING|SUCCEEDED|FAILED|REFUNDED
  createdAt             DateTime @default(now())
}
model Plan         { id String @id; name String; priceCents Int; maxArtists Int; aiCreditsMonthly Int; features Json }
model Subscription { id String @id @default(cuid()); studioId String @unique; planId String; stripeSubscriptionId String @unique; status String; currentPeriodEnd DateTime }

// ── Social / transversal ──
model Review       { id String @id @default(cuid()); orderId String @unique; studioId String; artistId String; clientId String; rating Int; comment String?; createdAt DateTime @default(now()) }
model Favorite     { userId String; targetType FavKind; targetId String; @@id([userId, targetType, targetId]) }  // ARTIST|STUDIO|PORTFOLIO_ITEM
model Notification { id String @id @default(cuid()); userId String; type String; payload Json; readAt DateTime?; createdAt DateTime @default(now()) }
model AiUsageLog   { id String @id @default(cuid()); studioId String; provider String; operation String; costCents Int?; createdAt DateTime @default(now()) }
model AuditLog     { id String @id @default(cuid()); studioId String?; userId String?; action String; entity String; entityId String; metadata Json?; ip String?; createdAt DateTime @default(now()) }
```

Todas as tabelas tenant-scoped carregam `studioId` indexado e ficam sob RLS.

---

## 4. Fluxos

### 4.1 Máquina de estados do pedido (fluxo principal)

```
 Cliente escolhe artista + estilo, envia referências e briefing
        │
        ▼
   SUBMITTED ──(artista envia orçamento)──► QUOTED
        │                                      │ cliente aceita
        │ cliente cancela                      ▼
        ▼                              DEPOSIT_PENDING ──(Stripe webhook ok)──► DEPOSIT_PAID
    CANCELLED                                                                       │
                                                                                    ▼
                              ┌──────────────────────────────────────────── IN_DESIGN
                              │                                                     │ artista envia arte
                              │ nova versão                                         ▼
                     CHANGES_REQUESTED ◄──(cliente pede ajuste)──── DESIGN_REVIEW
                                                                            │ cliente aprova
                                                                            ▼
                                                                   DESIGN_APPROVED
                                                                            │ cliente envia foto do corpo
                                                                            ▼
                                                        AWAITING_BODY_PHOTO → SIMULATING (job IA)
                                                                            │ resultado pronto (WS)
                                                                            ▼
                                        (ajusta posição/tamanho, re-gera) SIMULATION_REVIEW
                                                                            │ cliente aprova
                                                                            ▼
                                                              SIMULATION_APPROVED
                                                                            │ escolhe horário na agenda
                                                                            ▼
                                                                       SCHEDULED
                                                                            │ sessão realizada + pagamento final
                                                                            ▼
                                                                       COMPLETED ──(avaliação)──► REVIEWED
```

Transições são validadas no domínio (`order-state-machine.ts`); toda transição gera `OrderEvent` e notificação.

### 4.2 Fluxo de pagamento

```
Sinal:  aceite do orçamento → PaymentIntent (Connect, destination = estúdio,
        application_fee = % plataforma) → checkout → webhook payment_intent.succeeded
        → Payment SUCCEEDED → Order DEPOSIT_PAID → notifica artista.
Final:  após sessão → mesmo fluxo com kind=FINAL → COMPLETED.
SaaS:   estúdio assina plano → Stripe Billing → webhooks de subscription
        atualizam Subscription.status → gates de limite (artistas, créditos IA).
Falhas: webhook idempotente (event id persistido); retry automático do Stripe.
```

### 4.3 Fluxo da simulação por IA

```
1. Cliente envia foto (presigned URL → R2) e escolhe posição/tamanho no editor.
2. POST /api/simulations → valida (zod), checa créditos do plano, enfileira BullMQ.
3. Worker: baixa foto + arte → pipeline (segmenta pele → perspectiva/curvatura →
   warp da arte → harmonização de luz/sombra/textura via provider ativo) →
   gera variantes P/M/G → sobe no R2 → Simulation DONE → AiUsageLog.
4. Realtime emite `simulation:done` → editor atualiza; cliente pode arrastar/
   redimensionar (re-render local via canvas) e re-gerar quando mudar a posição.
```

---

## 5. Casos de Uso (por perfil)

| Perfil | Casos de uso (application/use-cases/) |
|---|---|
| **Admin** | CriarEstudio, SuspenderEstudio, RemoverEstudio, ListarMetricasPlataforma, GerenciarPlanos, GerenciarAssinaturas, ConsultarLogsAuditoria, GerenciarUsuarios, ConsultarUsoIA |
| **Dono do estúdio** | CompletarOnboardingStripe, ConvidarTatuador, RemoverTatuador, EditarEstudio, EditarAgendaEstudio, ListarPedidosEstudio, AprovarPagamento/Reembolso, ResponderCliente, AlterarPrecos, VerFinanceiro, GerenciarAssinatura |
| **Tatuador** | EditarPerfil, GerenciarPortfolio (criar/editar/remover item, antes-depois, vídeo), DefinirDisponibilidade, EnviarOrcamento, EnviarArte, SolicitarNovaFoto, AprovarProjeto, ConversarComCliente, VerEstatisticas, VerAvaliacoes |
| **Cliente** | CriarConta, BuscarEstudios, BuscarTatuadores (filtros: estilo, cidade, preço, nota), FavoritarItem, CriarPedido (estilo + referências + briefing), AceitarOrcamento, PagarSinal, ConversarComTatuador, AprovarArte / SolicitarAlteracao, EnviarFotoCorpo, GerarSimulacao, AjustarPosicaoTamanho, AprovarSimulacao, AgendarSessao, PagarFinal, AvaliarAtendimento, ExportarMeusDados (LGPD), ExcluirConta |

Cada use case: DTO de entrada validado com zod → regras no domínio → repositório → eventos (notificação, realtime, auditoria). Nenhuma regra de negócio em componente React ou route handler.

---

## 6. Wireframes (ASCII)

### 6.1 Home (marketing)

```
┌────────────────────────────────────────────────────────────────┐
│ ◈ InkVision      Estúdios  Tatuadores  Estilos      [Entrar]   │
├────────────────────────────────────────────────────────────────┤
│        SUA PRÓXIMA TATUAGEM, VISUALIZADA ANTES DA AGULHA       │
│   Encontre artistas, aprove a arte e veja na sua pele com IA   │
│   ┌──────────────────────────────────────────────┐             │
│   │ 🔍 Buscar estúdio, tatuador ou estilo…       │ [Buscar]    │
│   └──────────────────────────────────────────────┘             │
├────────────────────────────────────────────────────────────────┤
│ Estilos:  (Fine Line)(Blackwork)(Old School)(Realismo)         │
│           (Oriental)(Geométrica)(Minimalista)(Tribal)(Aquarela)│
├────────────────────────────────────────────────────────────────┤
│ MELHORES TATUADORES        ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│                            │ 👤 │ │ 👤 │ │ 👤 │ │ 👤 │  →      │
│                            │★4.9│ │★4.8│ │★4.8│ │★4.7│         │
├────────────────────────────────────────────────────────────────┤
│ GALERIA (masonry) │▓▓│░░░░│▓▓▓│  DEPOIMENTOS  ❝…❞ ❝…❞          │
├────────────────────────────────────────────────────────────────┤
│ FAQ ˅˅˅        [CTA: Comece seu projeto agora]        Footer   │
└────────────────────────────────────────────────────────────────┘
```

### 6.2 Perfil do tatuador

```
┌────────────────────────────────────────────────────────────────┐
│ ┌─────┐  RAFA COSTA                       ★ 4.9 (127)          │
│ │ 👤  │  Blackwork · Fine Line · 8 anos                        │
│ └─────┘  ⌀ R$ 900 · responde em ~2h · @rafacosta.ink           │
│            [ SOLICITAR ORÇAMENTO ]   [♡ Favoritar]             │
├──────────────┬─────────────────────────────────────────────────┤
│ Bio          │ PORTFÓLIO  [Todos|Fine Line|Blackwork]          │
│ Avaliações   │ ┌────┐ ┌────┐ ┌────┐ ┌────┐                     │
│ Agenda 📅    │ │ ▓▓ │ │ ░░ │ │antes│ │ ▶  │                    │
│ (próx. vagas)│ │♥231│ │♥98 │ │depois│ │vídeo│                  │
└──────────────┴─────────────────────────────────────────────────┘
```

### 6.3 Chat do pedido

```
┌── Pedido #482 · Rafa Costa ──────────────── [status: EM ARTE] ─┐
│ ─────────────────────  quinta, 14:02  ────────────────────     │
│ ┌ Cliente ─────────────────┐                                   │
│ │ Referências em anexo 🖼🖼 │                                   │
│ └──────────────────────────┘  ┌ Rafa ────────────────────┐     │
│                               │ Fechado! Primeiro esboço  │    │
│                               │ 📎 esboco-v1.png    ✓✓    │    │
│                               └──────────────────────────┘     │
│                               [ ✔ Aprovar arte ] [ ✎ Ajustes ] │
│  Rafa está digitando…                                          │
│ ┌──────────────────────────────────────┐ 🎤 📎 [Enviar]        │
└─┴──────────────────────────────────────┴───────────────────────┘
```

### 6.4 Editor de simulação

```
┌── SIMULAÇÃO · Pedido #482 ─────────────────────────────────────┐
│ ┌──────────────────────────────┐  Tamanho: (P) (●M) (G)        │
│ │        foto do braço         │  Posição: arraste a arte      │
│ │        ┌─────────┐           │  Rotação: ⟲ ──●───── ⟳        │
│ │        │  ARTE   │ ◄─ drag   │                               │
│ │        └─────────┘           │  [⟳ Re-gerar com IA]          │
│ │   (resultado fotorrealista)  │  [ ✔ Aprovar simulação ]      │
│ └──────────────────────────────┘  [ ⬇ Baixar prévia ]          │
└────────────────────────────────────────────────────────────────┘
```

### 6.5 Painel do tatuador

```
┌ InkVision ▸ Studio Alma ───────────────────────────── 👤 Rafa ─┐
│ ▸ Pedidos   │ HOJE: 2 sessões · 3 pedidos aguardando arte      │
│   Agenda    │ ┌ Pedido #490 · NOVO ────────── [Ver briefing] ┐ │
│   Chat (3)  │ │ Fine line · antebraço · sinal pago            ││
│   Clientes  │ └───────────────────────────────────────────────┘│
│   Portfólio │ AGENDA ─ seg ─ ter ─ qua ─ qui ─ sex ─           │
│   Financeiro│         █14h        █10h  █16h                   │
│   Estatíst. │ Faturamento mês: R$ 12.400 ▁▃▅▇                  │
└─────────────┴──────────────────────────────────────────────────┘
```

### 6.6 Dashboard admin

```
┌ InkVision Admin ───────────────────────────────────────────────┐
│ MRR R$ 48.2k ▲8% │ Estúdios 312 ▲12 │ Clientes 9.4k │ IA 41k img│
│ ┌ Receita (12m) ▁▂▃▅▆▇ ┐ ┌ Uso de IA por provider ◔ fal 62% ┐  │
│ Assinaturas: 280 ativas · 18 trial · 14 inadimplentes          │
│ Logs recentes: [10:41] studio.suspended … [10:22] plan.changed │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Diagrama de Entidades (ER)

```
                          ┌──────────┐
        platformRole ─────│   User   │────────────┐
                          └────┬─────┘            │
              ┌────────────────┼──────────────┐   │ 1:N como cliente
              │ N:N via        │ 1:1          │   │
        ┌─────▼──────┐  ┌──────▼───────┐      │   │
        │StudioMember│  │ArtistProfile │      │   │
        └─────┬──────┘  └──────┬───────┘      │   │
              │ N:1            │ N:N Style    │   │
        ┌─────▼──────┐         ├── 1:N PortfolioItem ── Like/Comment
        │   Studio   │         │              │   │
        └─────┬──────┘         │       ┌──────▼───▼──┐
   1:1 Subscription──Plan      └──────►│    Order    │◄─ N:1 Style
   1:N AiUsageLog                      └──────┬──────┘
   1:N AuditLog          ┌────────────────────┼───────────────────────┐
                         │            │       │          │            │
                  1:N OrderReference  │  1:N Payment  1:1 Review  1:N OrderEvent
                         │            │       │
                 1:N DesignVersion ───┤  1:1 Appointment ── AvailabilityRule/
                         │            │                       TimeOff (Artist)
                 1:N Simulation ──────┤
                                      │
                          1:1 Conversation ── 1:N Message
        User ── N:N Favorite ──► Artist | Studio | PortfolioItem
        User ── 1:N Notification
```

---

## 8. Roadmap por Sprints

Cada sprint fecha com: demo funcional, explicação das decisões, revisão de código, lista de melhorias — e só então avança.

| # | Sprint | Entregas | Critério de aceite |
|---|---|---|---|
| 0 | **Fundação** | Monorepo (pnpm+Turbo), Docker compose dev, Prisma+Postgres+Redis, Better Auth (e-mail/senha + roles), tema shadcn dark/light, CI (lint, typecheck, test) | `docker compose up` sobe tudo; login/cadastro funcionando |
| 1 | **Multi-tenant + Estúdios** | Modelos Studio/Member, Prisma tenant extension, RLS, middleware de subdomínio, CRUD de estúdio (admin), onboarding do dono, seeds | Testes de isolamento cross-tenant passam; estúdio acessível por slug |
| 2 | **Artistas + Portfólio** | Perfil do tatuador, estilos (seed 9 categorias), upload R2 presigned, portfólio (imagem/vídeo/antes-depois, tags, likes, comentários) | Artista publica portfólio completo; mídia servida via R2 |
| 3 | **Descoberta + Home** | Home completa (hero, busca, categorias, top artistas, galeria, depoimentos, FAQ, CTA), busca com filtros, página pública do estúdio/artista, SEO (metadata, OG, JSON-LD, sitemap), ISR | Lighthouse ≥95 nas páginas públicas |
| 4 | **Pedidos + Orçamento** | State machine do Order, briefing + referências, orçamento do artista, aceite do cliente, OrderEvents, notificações in-app | Fluxo SUBMITTED→QUOTED→DEPOSIT_PENDING navegável |
| 5 | **Chat realtime** | apps/realtime (Socket.IO+Redis), conversas por pedido, texto/áudio/imagem/PDF/vídeo, digitando, entregue/lido, notificações | Dois browsers conversam em tempo real com mídia |
| 6 | **Pagamentos** | Stripe Connect onboarding do estúdio, sinal (destination charge + fee), webhooks idempotentes, pagamento final, Stripe Billing (planos SaaS + gates de limite) | Sinal pago em teste move pedido p/ DEPOSIT_PAID; assinatura controla limites |
| 7 | **Camada IA v1** | packages/ai (ports+registry), providers Fal.ai e Replicate, fila BullMQ, worker, AiUsageLog, envio de foto do corpo, simulação básica | Trocar provider por env sem mudar código; simulação gerada e entregue via WS |
| 8 | **Editor de simulação** | Editor canvas (arrastar, escala P/M/G, rotação), re-geração, variantes, aprovação da simulação, pipeline refinado (pele/perspectiva/luz) | Cliente posiciona, re-gera e aprova; resultado fotorrealista |
| 9 | **Agendamento** | Disponibilidade do artista, folgas, agenda do estúdio, escolha de horário pelo cliente, reagendamento, lembretes (worker) | SIMULATION_APPROVED→SCHEDULED com conflitos bloqueados |
| 10 | **Painéis + Social** | Painel do cliente (8 seções), painel do tatuador (8 seções), painel do dono, avaliações pós-sessão, favoritos, estatísticas do artista | Fluxo completo de ponta a ponta: cadastro→avaliação |
| 11 | **Admin + LGPD** | Dashboard admin (MRR, estúdios, assinaturas, uso IA, gráficos), logs de auditoria, gestão de usuários/planos, export/exclusão de dados (LGPD) | Métricas reais renderizadas; export de dados do titular funcional |
| 12 | **Hardening + Deploy** | Rate limit, CSP/headers, sanitização, testes de segurança/isolamento, PWA (manifest, offline shell), Lighthouse ≥95 geral, Dockerfiles prod, deploy Coolify, runbook | Deploy em produção na VPS; checklist de segurança e performance verde |
