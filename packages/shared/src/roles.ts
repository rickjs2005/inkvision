/** Papel global na plataforma. */
export const PLATFORM_ROLES = ["ADMIN", "USER"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Papel dentro de um estúdio (multi-tenant). Cliente NÃO possui membership. */
export const STUDIO_ROLES = ["OWNER", "MANAGER", "ARTIST"] as const;
export type StudioRole = (typeof STUDIO_ROLES)[number];

/** Hierarquia de permissão dentro do estúdio (maior = mais poder). */
export const STUDIO_ROLE_RANK: Record<StudioRole, number> = {
  OWNER: 3,
  MANAGER: 2,
  ARTIST: 1,
};

export function studioRoleAtLeast(role: StudioRole, min: StudioRole): boolean {
  return STUDIO_ROLE_RANK[role] >= STUDIO_ROLE_RANK[min];
}
