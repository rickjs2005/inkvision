import type { StudioRole } from "@inkvision/shared";
import { studioRoleAtLeast } from "@inkvision/shared";
import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { ForbiddenError } from "../../../domain/errors";
import type { Artist, ArtistRepository } from "../../ports/artist-repository";
import type { StyleRepository } from "../../ports/style-repository";
import type { UserRepository } from "../../ports/user-repository";
import type { AuditLogger } from "../../ports/audit-logger";
import type { StudioRepository } from "../../ports/studio-repository";
import type { SubscriptionRepository } from "../../ports/subscription-repository";

export interface ArtistUseCaseDeps {
  artists: ArtistRepository;
  styles: StyleRepository;
  users: UserRepository;
  studios: Pick<StudioRepository, "addMember" | "findById">;
  subscriptions: Pick<SubscriptionRepository, "getActiveForStudio">;
  audit: AuditLogger;
}

/**
 * Pode gerenciar o artista: o próprio tatuador (self), um gerente/dono do
 * mesmo estúdio, ou o admin da plataforma.
 */
export function assertCanManageArtist(actor: Actor, artist: Pick<Artist, "userId" | "studioId">) {
  if (isPlatformAdmin(actor)) return;
  if (artist.userId === actor.userId) return;
  const m = membershipIn(actor, artist.studioId);
  if (!m || !studioRoleAtLeast(m.role, "MANAGER")) throw new ForbiddenError();
}

export function assertStudioManager(actor: Actor, studioId: string, min: StudioRole = "MANAGER") {
  if (isPlatformAdmin(actor)) return;
  const m = membershipIn(actor, studioId);
  if (!m || !studioRoleAtLeast(m.role, min)) throw new ForbiddenError();
}
