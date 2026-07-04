import type { PlatformRole, StudioRole } from "@inkvision/shared";
import { studioRoleAtLeast } from "@inkvision/shared";
import { ForbiddenError, UnauthenticatedError } from "./errors";

/** Contexto de quem executa um caso de uso. Montado a partir da sessão. */
export interface Actor {
  userId: string;
  platformRole: PlatformRole;
  memberships: { studioId: string; role: StudioRole }[];
}

export function isPlatformAdmin(actor: Actor): boolean {
  return actor.platformRole === "ADMIN";
}

export function membershipIn(actor: Actor, studioId: string) {
  return actor.memberships.find((m) => m.studioId === studioId) ?? null;
}

/** Garante que o actor pertence ao estúdio com pelo menos `minRole`. */
export function assertStudioRole(actor: Actor, studioId: string, minRole: StudioRole): void {
  if (isPlatformAdmin(actor)) return; // admin da plataforma atravessa tenants
  const m = membershipIn(actor, studioId);
  if (!m || !studioRoleAtLeast(m.role, minRole)) {
    throw new ForbiddenError();
  }
}

export function assertPlatformAdmin(actor: Actor): void {
  if (!isPlatformAdmin(actor)) throw new ForbiddenError("Requer administrador da plataforma.");
}

export function assertAuthenticated(actor: Actor | null | undefined): asserts actor is Actor {
  if (!actor) throw new UnauthenticatedError();
}
