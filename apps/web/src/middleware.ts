import { NextResponse, type NextRequest } from "next/server";

/**
 * Sprint 0: resolve o slug do estúdio a partir do subdomínio ({slug}.dominio)
 * e injeta o header `x-studio-slug` para os handlers. O isolamento efetivo
 * (Prisma extension + RLS) entra na Sprint 1.
 *
 * Fallback path-based `/s/{slug}` é tratado pelas rotas diretamente.
 */
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const rootHost = ROOT_DOMAIN.split(":")[0] ?? "";

  const isSubdomain =
    hostname !== rootHost &&
    hostname !== `www.${rootHost}` &&
    hostname.endsWith(`.${rootHost}`);

  const res = NextResponse.next();

  if (isSubdomain) {
    const slug = hostname.replace(`.${rootHost}`, "");
    res.headers.set("x-studio-slug", slug);
  }

  return res;
}

export const config = {
  // Ignora assets estáticos e rotas internas do Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|avif)$).*)"],
};
