import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

/** Aplica prisma/rls.sql. Rode após as migrations. Idempotente. */
const here = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(here, "rls.sql"), "utf8");
const prisma = new PrismaClient();

prisma
  .$executeRawUnsafe(sql)
  .then(() => console.log("✓ RLS aplicado"))
  .catch((e) => {
    console.error("❌ Falha ao aplicar RLS:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
