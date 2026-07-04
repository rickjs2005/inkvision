/**
 * Init do banco em PRODUÇÃO. Roda UMA vez no deploy, com um DATABASE_URL de
 * SUPERUSUÁRIO (o `migrate deploy` é chamado à parte no entrypoint):
 *   1. cria o role `inkvision_app` (NÃO-superusuário) que o app usa;
 *   2. concede privilégios;
 *   3. aplica o RLS.
 *
 * A senha do role vem de APP_DB_PASSWORD (deve bater com o DATABASE_URL do app).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const here = dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();
const appPassword = process.env.APP_DB_PASSWORD ?? "inkvision_app";

async function main() {
  // 1+2. Role + grants (statements individuais — protocolo estendido não aceita múltiplos).
  const roleStmts = [
    `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'inkvision_app') THEN CREATE ROLE inkvision_app LOGIN PASSWORD '${appPassword}' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE; ELSE ALTER ROLE inkvision_app PASSWORD '${appPassword}'; END IF; END $$;`,
    "GRANT USAGE ON SCHEMA public TO inkvision_app",
    "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO inkvision_app",
    "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO inkvision_app",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO inkvision_app",
    "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO inkvision_app",
  ];
  for (const s of roleStmts) await prisma.$executeRawUnsafe(s);
  console.log("✓ role inkvision_app + grants");

  // 3. RLS (arquivo é um único bloco DO — vai como um comando).
  const rls = readFileSync(join(here, "rls.sql"), "utf8");
  await prisma.$executeRawUnsafe(rls);
  console.log("✓ RLS aplicado");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
