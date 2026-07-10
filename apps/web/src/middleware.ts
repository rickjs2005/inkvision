import { NextResponse, type NextRequest } from "next/server";

/**
 * Sprint 0: resolve o slug do estúdio a partir do subdomínio ({slug}.dominio)
 * e injeta o header `x-studio-slug` para os handlers. O isolamento efetivo
 * (Prisma extension + RLS) entra na Sprint 1.
 *
 * Fallback path-based `/s/{slug}` é tratado pelas rotas diretamente.
 */
const ROOT_DOMAIN = process.env.ROOT_DOMAIN ?? "localhost:3000";

// Segmentos de path com bytes de controle/nulos (ex: /pedidos/novo/%00%01)
// nunca são rota válida — deixar isso chegar ao roteamento do Next faz a
// Vercel responder com a página crua "Bad request", fora da UI do app.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

export function middleware(req: NextRequest) {
  let pathname: string;
  try {
    pathname = req.nextUrl.pathname;
  } catch {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  if (CONTROL_CHARS_RE.test(pathname) || CONTROL_CHARS_RE.test(req.nextUrl.search)) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0] ?? "";
  const rootHost = ROOT_DOMAIN.split(":")[0] ?? "";

  const isSubdomain =
    hostname !== rootHost &&
    hostname !== `www.${rootHost}` &&
    hostname.endsWith(`.${rootHost}`);

  // Propaga o path atual como header de REQUEST — é a única forma de um
  // helper genérico como requireActor() (Server Component) saber pra onde
  // o usuário tentava ir antes de cair no guard de sessão expirada.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname + req.nextUrl.search);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

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
