/**
 * Só aceita destino interno relativo — nunca `//host` (protocol-relative) nem
 * URL absoluta. Compartilhado por login e cadastro para o funil preservar o
 * destino (ex.: CTA do perfil de um tatuador → cadastro → pedido com ELE).
 */
export function sanitizeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/painel";
  return next;
}

/** Anexa `?next=` a uma rota de auth, omitindo o default (/painel). */
export function withNext(path: "/login" | "/cadastro", next: string): string {
  return next === "/painel" ? path : `${path}?next=${encodeURIComponent(next)}`;
}
