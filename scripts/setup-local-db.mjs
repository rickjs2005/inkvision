/**
 * Setup do banco de desenvolvimento LOCAL — sem Docker, sem nuvem.
 * Usa o Postgres local embutido do Prisma (`prisma dev`).
 *
 *   node scripts/setup-local-db.mjs
 *
 * O que faz:
 *  1. Sobe (ou reaproveita) o servidor Postgres local do Prisma.
 *  2. Escreve DATABASE_URL em .env e apps/web/.env.
 *  3. Aplica o schema (db push) + RLS + o seed de demonstração.
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dbDir = join(root, "packages", "db");
const run = (cmd, cwd = root, env = {}) =>
  execSync(cmd, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, ...env } }).toString();

console.log("▸ Subindo o Postgres local do Prisma…");
let out = "";
try {
  out = run("npx prisma dev -d --name inkvision", dbDir);
} catch (e) {
  out = (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "");
}
const match = out.match(/postgres:\/\/[^\s]+/);
if (!match) {
  console.error("✗ Não consegui obter a URL do Prisma dev. Saída:\n", out);
  process.exit(1);
}
// A URL padrão aponta para template1; usamos o banco `postgres` e desligamos
// prepared statements (o proxy do prisma dev age como um pooler).
const base = match[0].replace(/\/template1/, "/postgres").split("?")[0];
const DATABASE_URL = `${base}?sslmode=disable&pgbouncer=true`;
console.log("  DATABASE_URL =", DATABASE_URL);

function upsertEnv(file) {
  let content = existsSync(file) ? readFileSync(file, "utf8") : "";
  if (/^DATABASE_URL=/m.test(content)) {
    content = content.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL=${DATABASE_URL}`);
  } else {
    content += `\nDATABASE_URL=${DATABASE_URL}\n`;
  }
  writeFileSync(file, content);
}

const rootEnv = join(root, ".env");
if (!existsSync(rootEnv)) copyFileSync(join(root, ".env.example"), rootEnv);
upsertEnv(rootEnv);
upsertEnv(join(root, "apps", "web", ".env"));
console.log("✓ .env atualizado (raiz + apps/web)");

const env = { DATABASE_URL };
console.log("▸ Aguardando o banco ficar pronto…");
let ready = false;
for (let i = 0; i < 20 && !ready; i++) {
  try {
    run("npx prisma db push --skip-generate", dbDir, env);
    ready = true;
  } catch {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500); // espera bloqueante
  }
}
if (!ready) {
  console.error("✗ O banco não respondeu a tempo. Rode `pnpm setup:local` de novo.");
  process.exit(1);
}
console.log("✓ Schema aplicado");
console.log("▸ Aplicando o RLS…");
run("npx tsx prisma/apply-rls.ts", dbDir, env);
console.log("▸ Rodando o seed de demonstração…");
process.stdout.write(run("npx tsx scripts/seed-demo.ts", join(root, "apps", "web"), env));

console.log("\n✅ Pronto! Agora rode:  pnpm dev   (web em :3000, realtime :4000)\n");
