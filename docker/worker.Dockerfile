# InkVision — apps/worker (BullMQ). Build a partir da RAIZ do monorepo:
#   docker build -f docker/worker.Dockerfile -t inkvision-worker .
FROM node:22-bookworm-slim AS base
RUN corepack enable && apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/config/package.json ./packages/config/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/core/package.json ./packages/core/
COPY packages/infra/package.json ./packages/infra/
COPY packages/ai/package.json ./packages/ai/
COPY apps/web/package.json ./apps/web/
COPY apps/realtime/package.json ./apps/realtime/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

FROM deps AS runner
COPY packages ./packages
COPY apps/worker ./apps/worker
RUN pnpm --filter @inkvision/db generate
ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@inkvision/worker", "start"]
