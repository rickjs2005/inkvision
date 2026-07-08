import "server-only";
import { ValidationError } from "@inkvision/core";

/**
 * Rate limiting distribuído. Quando `REDIS_URL` está definido usamos Redis
 * (janela fixa via INCR + PEXPIRE), o que funciona em produção multi-instância.
 * Sem Redis, caímos no store em memória (janela deslizante) — suficiente para
 * dev e instância única. A interface pública é assíncrona nos dois casos.
 */

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

// ---------------------------------------------------------------------------
// Backend Redis (opcional, lazy singleton)
// ---------------------------------------------------------------------------

// Import de tipo apenas — o pacote `ioredis` é resolvido em runtime somente
// quando `REDIS_URL` existe. Precisa instalar `ioredis` no apps/web.
type RedisClient = import("ioredis").Redis;

let redisClient: RedisClient | null = null;
let redisDisabled = false;

/** Retorna um cliente Redis singleton, ou null se indisponível/desligado. */
function getRedis(): RedisClient | null {
  if (redisDisabled) return null;
  if (redisClient) return redisClient;
  const url = process.env.REDIS_URL;
  if (!url) {
    redisDisabled = true;
    return null;
  }
  try {
    // Import dinâmico via require para não exigir o módulo quando não há Redis.
    const { Redis } = require("ioredis") as typeof import("ioredis");
    redisClient = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false });
    redisClient.on("error", (err) => {
      console.error("[rate-limit] erro no Redis:", err);
    });
    return redisClient;
  } catch (e) {
    console.error("[rate-limit] falha ao inicializar Redis, usando memória:", e);
    redisDisabled = true;
    return null;
  }
}

/** Janela fixa em Redis: INCR + PEXPIRE na primeira ocorrência da janela. */
async function rateLimitRedis(
  redis: RedisClient,
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    await redis.pexpire(redisKey, windowMs);
  }
  if (count > limit) {
    // TTL restante da janela; se -1/-2 (sem expiração), assume janela cheia.
    const ttl = await redis.pttl(redisKey);
    const retryAfterMs = ttl > 0 ? ttl : windowMs;
    return { ok: false, remaining: 0, retryAfterMs };
  }
  return { ok: true, remaining: Math.max(0, limit - count), retryAfterMs: 0 };
}

// ---------------------------------------------------------------------------
// Backend em memória (fallback, janela deslizante)
// ---------------------------------------------------------------------------

interface Bucket {
  hits: number[];
}
const store = new Map<string, Bucket>();

function rateLimitMemory(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const from = now - windowMs;
  const bucket = store.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > from);

  if (bucket.hits.length >= limit) {
    store.set(key, bucket);
    const oldest = bucket.hits[0] ?? now;
    return { ok: false, remaining: 0, retryAfterMs: oldest + windowMs - now };
  }

  bucket.hits.push(now);
  store.set(key, bucket);

  // Limpeza oportunista para não crescer sem limite.
  if (store.size > 5000) {
    for (const [k, b] of store) {
      if (b.hits.every((t) => t <= from)) store.delete(k);
    }
  }

  return { ok: true, remaining: limit - bucket.hits.length, retryAfterMs: 0 };
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

/**
 * Aplica rate limit a `key`. Usa Redis quando disponível, memória caso
 * contrário. Se o Redis falhar em runtime, degrada para memória (fail-open
 * para o backend, mas ainda contando localmente).
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis) {
    try {
      return await rateLimitRedis(redis, key, limit, windowMs);
    } catch (e) {
      console.error("[rate-limit] Redis indisponível, caindo para memória:", e);
      // Continua no fallback em memória abaixo.
    }
  }
  return rateLimitMemory(key, limit, windowMs);
}

/**
 * Aplica rate limit e lança em caso de estouro. Pensado para ser usado dentro
 * do fluxo de `run()` das actions, que captura DomainError.
 *
 * TODO: idealmente o excesso seria um HTTP 429, mas mapeamos para o fluxo de
 * erro de domínio existente (ValidationError → 400) por simplicidade.
 */
export async function enforceRateLimit(key: string, limit: number, windowMs: number): Promise<void> {
  const rl = await rateLimit(key, limit, windowMs);
  if (!rl.ok) {
    throw new ValidationError("Muitas requisições. Aguarde alguns segundos e tente novamente.");
  }
}

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

/** Rejeita requisições de outra origem (defesa CSRF em rotas de API que mutam estado). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // navegadores enviam origin em POST cross-site; ausência = same-site/curl
  try {
    return new URL(origin).host === new URL(APP_URL).host;
  } catch {
    return false;
  }
}

/**
 * Extrai um identificador de cliente da requisição (IP), para rate limit.
 *
 * `X-Forwarded-For` é uma lista de IPs separada por vírgula: cada proxy no
 * caminho ANEXA o IP de quem lhe conectou. O PRIMEIRO valor é o IP que o
 * cliente que fez a requisição inicial *declarou* — e, se esse cliente for o
 * próprio atacante falando direto com o primeiro proxy confiável, ele pode
 * mandar `X-Forwarded-For: 1.2.3.4` e o array terá só esse valor forjado
 * (nenhum proxy intermediário para anexar o IP real antes dele). Usar o
 * primeiro valor tornava o rate limit completamente inefetivo — bastava trocar
 * o header a cada requisição. O ÚLTIMO valor da lista é o que o proxy mais
 * próximo do nosso servidor (Vercel, ou Caddy no self-host) anexou com o IP
 * de quem de fato conectou a ele — não é algo que o cliente final controla.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ips = xff.split(",").map((ip) => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[ips.length - 1]!;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}
