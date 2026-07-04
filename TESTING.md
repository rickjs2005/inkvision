# Como testar o InkVision localmente

Sem Docker, sem nuvem. Só Node 20+ e pnpm. O banco roda com o **Postgres local embutido do Prisma** (`prisma dev`), e storage, pagamentos e IA são **mockados** — então o fluxo inteiro funciona sem nenhuma chave de API.

## 1. Instalar e configurar (uma vez)

```bash
pnpm install
node scripts/setup-local-db.mjs      # ou: pnpm setup:local
```

Esse comando sobe o Postgres local, escreve o `DATABASE_URL` no `.env`, cria o schema, aplica o RLS e roda o **seed de demonstração** (estúdio, tatuadores, portfólio, contas de teste e um pedido de exemplo).

## 2. Rodar tudo

```bash
pnpm dev
```

Sobe três processos via Turbo:

- **web** → http://localhost:3000 (Next.js)
- **realtime** → :4000 (chat + notificações de simulação)
- **worker** → ocioso (no dev os jobs de IA rodam in-process no próprio web)

> Se a porta 3000 estiver ocupada (ex.: outro projeto seu rodando), pare o outro dev server, ou rode só o web noutra porta: `pnpm --filter @inkvision/web exec next dev -p 3100`.

## 3. Contas de teste

Todas com a senha **`inkvision123`**:

| E-mail | Papel |
|---|---|
| `admin@inkvision.app` | Admin da plataforma |
| `alma@inkvision.app` | Dona do Estúdio Alma |
| `rafa@inkvision.app` | Tatuador (já tem 1 pedido novo) |
| `bia@inkvision.app` | Tatuador |
| `cliente@inkvision.app` | Cliente (já tem 1 pedido enviado) |

## 4. Roteiro de teste (fluxo completo)

**Como visitante**
1. Home `/` — hero, categorias, melhores tatuadores, galeria, FAQ.
2. `/tatuadores` — filtre por estilo. Abra **Rafa Costa** (`/t/...`) — veja o portfólio, curta e comente (precisa estar logado).
3. `/s/alma` — página pública do estúdio.

**Como cliente** (`cliente@inkvision.app`)
4. No perfil de um tatuador, clique **Solicitar orçamento** — escolha estilo, parte do corpo, escreva o briefing e anexe referências → envia o pedido.
5. `/pedidos` → abra o pedido. Aqui você acompanha o status e conversa pelo **chat em tempo real**.

**Como tatuador** (`rafa@inkvision.app`, em outra aba/navegador)
6. `/artista` → seu perfil → **Pedidos recebidos** → abra o pedido → **envie o orçamento** (valor + sinal).

**Cliente**
7. No pedido: **Aceitar orçamento** → **Pagar sinal** → na tela de checkout (mock), **Simular pagamento** → o pedido vira "Sinal pago".

**Tatuador**
8. No pedido, aba **Arte**: envie uma imagem de arte → vai para aprovação do cliente.

**Cliente**
9. **Aprovar arte** → **envie uma foto** da parte do corpo → no **editor**, arraste a arte, ajuste tamanho/rotação → **Gerar simulação**.
10. A simulação aparece (composição da arte na foto, tamanhos P/M/G) → **Aprovar simulação**.

**Cliente (fecha o fluxo)**
11. **Agende a sessão** — escolha um dos horários disponíveis (o Rafa tem disponibilidade seg–sex 10h–18h no seed) → o pedido vira "Agendado".
12. **Pagar valor final** → checkout mock → o pedido é **Concluído**.
13. **Avalie** com estrelas + comentário → o pedido vira "Avaliado" e a nota do tatuador é recalculada (aparece no perfil público `/t/...`).

> O chat, o "digitando", as notificações e o "simulação pronta" acontecem em tempo real — deixe as duas contas abertas lado a lado para ver.

**Como tatuador**, em `/artista/.../agenda` você define a disponibilidade semanal que gera os horários ofertados ao cliente.

**Como dona** (`alma@inkvision.app`)
11. `/painel` → no card do estúdio: **Tatuadores** (adicionar por e-mail) e **Pagamentos** (conectar conta, assinar plano).

**Como admin** (`admin@inkvision.app`)
14. `/admin` — dashboard com MRR, receita, estúdios, uso de IA e gráficos (números reais aparecem depois de fechar um pedido).
15. `/admin/estudios` — cadastrar/suspender/remover estúdios · `/admin/logs` — auditoria.

**Privacidade (LGPD)** — em `/conta` (qualquer conta): baixe seus dados em JSON ou exclua a conta (anonimização).

## 5. O que é mockado (e como se comporta)

- **Uploads (Cloudflare R2)** → não sobem de verdade; imagens resolvem para fotos reais de tatuagem (Unsplash) para o demo parecer real.
- **Pagamentos (Stripe)** → checkout interno com botão "Simular pagamento"; nenhum valor é cobrado.
- **IA (simulação)** → a arte é composta sobre a foto no navegador (com o posicionamento que você escolher). Trocar por um provider real (Fal.ai/Replicate) é só configurar `AI_SIMULATION_PROVIDER` + a chave.

Trocar qualquer um por real não muda o resto do código — são adapters plugáveis.

## 6. Reaplicar / limpar os dados de demo

```bash
pnpm seed:demo      # recria o estúdio, tatuadores e pedido de exemplo
```

## Problemas comuns

- **Porta 3000 ocupada** → pare outros dev servers ou rode o web noutra porta (ver passo 2).
- **`DATABASE_URL` / banco fora do ar** → rode `pnpm setup:local` de novo (sobe o Postgres local e reaplica tudo).
- **Prisma dev** → é um Postgres local de verdade; os dados persistem entre reinícios. Para ver as tabelas: `pnpm db:studio`.

## Nota de segurança (produção)

O isolamento multi-tenant tem duas camadas: a extensão do Prisma (filtro por `studioId` em toda query) e o RLS do Postgres. **Em produção, o app deve conectar com um role NÃO-superusuário** (ex.: `inkvision_app`), senão o Postgres ignora o RLS. O `prisma dev` local só oferece o superusuário, então a camada de RLS não é exercida no dev (a extensão continua isolando tudo corretamente); os testes de RLS puro rodam contra o banco de produção/Supabase.
