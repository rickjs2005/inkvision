import "server-only";

/**
 * Rate limiting (janela deslizante). Store em memória — suficiente para dev e
 * instância única. Reforço em produção multi-instância: trocar o store por Redis
 * (sorted set por chave). A interface não muda.
 */
interface Bucket {
  hits: number[];
}
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
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

/** Extrai um identificador de cliente da requisição (IP). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
