/** Gera um slug URL-safe a partir de um nome. Função pura. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Subdomínios reservados que não podem virar slug de estúdio. */
export const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "auth",
  "assets",
  "static",
  "cdn",
  "mail",
  "blog",
  "help",
  "support",
  "status",
  "s",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
