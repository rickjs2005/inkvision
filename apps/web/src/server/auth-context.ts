import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Actor } from "@inkvision/core";
import type { PlatformRole, StudioRole } from "@inkvision/shared";
import { withAdmin } from "@inkvision/db";
import { auth } from "@/lib/auth";

/** Sessão atual (ou null). Memoizado por request. */
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
});

/** Monta o Actor do caso de uso a partir da sessão + memberships no banco. Memoizado por request. */
export const getActor = cache(async (): Promise<Actor | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  // StudioMember tem RLS por studioId — sem contexto de tenant/admin a
  // política nunca casa e a consulta sempre volta vazia (mesmo com
  // memberships reais). Aqui filtramos pelo PRÓPRIO userId, então é seguro
  // ler via admin: cada usuário só enxerga a si mesmo.
  const memberships = await withAdmin((tx) =>
    tx.studioMember.findMany({
      where: { userId: user.id },
      select: { studioId: true, role: true },
    }),
  );

  return {
    userId: user.id,
    platformRole: ((user as { platformRole?: PlatformRole }).platformRole ?? "USER") as PlatformRole,
    memberships: memberships.map((m) => ({ studioId: m.studioId, role: m.role as StudioRole })),
  };
});

/** Exige sessão; redireciona para /login caso contrário. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) redirect("/login");
  return actor;
}

/** Exige admin da plataforma; redireciona se não for. */
export async function requirePlatformAdmin(): Promise<Actor> {
  const actor = await requireActor();
  if (actor.platformRole !== "ADMIN") redirect("/");
  return actor;
}
