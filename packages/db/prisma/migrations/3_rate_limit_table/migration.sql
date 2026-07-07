-- Tabela de contadores de rate limit do Better Auth (`rateLimit.storage =
-- "database"` em apps/web/src/lib/auth.ts). Necessária para o rate limit da
-- rota de auth funcionar corretamente com múltiplas instâncias
-- serverless/container (o fallback em memória do better-auth é por instância).

CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");
