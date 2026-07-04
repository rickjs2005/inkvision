import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Actor } from "@inkvision/core";
import type { PlatformRole, StudioRole } from "@inkvision/shared";
import { prisma } from "@inkvision/db";
import { auth } from "@/lib/auth";

/** Sessão atual (ou null). */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

/** Monta o Actor do caso de uso a partir da sessão + memberships no banco. */
export async function getActor(): Promise<Actor | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const memberships = await prisma.studioMember.findMany({
    where: { userId: user.id },
    select: { studioId: true, role: true },
  });

  return {
    userId: user.id,
    platformRole: ((user as { platformRole?: PlatformRole }).platformRole ?? "USER") as PlatformRole,
    memberships: memberships.map((m) => ({ studioId: m.studioId, role: m.role as StudioRole })),
  };
}

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
