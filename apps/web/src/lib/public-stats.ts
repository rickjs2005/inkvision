/**
 * Métricas públicas de prova social — tipos e formatação (client-safe).
 * A leitura fica em `@/server/queries/home` (getPublicStats).
 */

export interface PublicStats {
  /** Simulações de IA geradas na plataforma (AiUsageLog · operation=simulate). */
  simulations: number;
  /** Estúdios com status ACTIVE. */
  activeStudios: number;
  /** Média ponderada das avaliações dos tatuadores ativos (null sem avaliações). */
  ratingAvg: number | null;
  /** Total de avaliações somadas. */
  ratingCount: number;
}

/**
 * Contagem para vitrine: exata abaixo de mil; acima, arredonda para baixo
 * ("12.345" → "12.000+") — nunca infla o número real.
 */
export function formatStatCount(n: number): string {
  if (n < 1000) return String(n);
  const step = n >= 10_000 ? 1000 : 100;
  return `${(Math.floor(n / step) * step).toLocaleString("pt-BR")}+`;
}

/** Nota com uma casa decimal, no estilo da marca ("4.9"). */
export function formatRating(avg: number): string {
  return avg.toFixed(1);
}
