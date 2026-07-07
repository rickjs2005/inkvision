import type { StudioRole } from "@inkvision/shared";
import { studioRoleAtLeast } from "@inkvision/shared";
import { type Actor, isPlatformAdmin, membershipIn } from "../../../domain/actor";
import { ForbiddenError } from "../../../domain/errors";
import type { Artist, ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { NotificationRepository } from "../../ports/notification-repository";
import type { AuditLogger } from "../../ports/audit-logger";
import type { EmailService } from "../../ports/email-service";
import type { UserRepository } from "../../ports/user-repository";

export interface OrderUseCaseDeps {
  orders: OrderRepository;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
  audit: AuditLogger;
  users: Pick<UserRepository, "findById">;
  email: EmailService;
  /** URL pública do app (para links nos e-mails). */
  appUrl: string;
}

/**
 * Pode agir sobre o pedido pelo lado do estúdio: o tatuador designado (self),
 * gerente/dono do estúdio, ou admin da plataforma.
 */
export function assertStudioSide(
  actor: Actor,
  order: { studioId: string; artistId: string },
  artist: Pick<Artist, "userId"> | null,
  min: StudioRole = "ARTIST",
) {
  if (isPlatformAdmin(actor)) return;
  if (artist && artist.userId === actor.userId) return; // tatuador designado
  const m = membershipIn(actor, order.studioId);
  if (!m || !studioRoleAtLeast(m.role, min === "ARTIST" ? "MANAGER" : min)) {
    throw new ForbiddenError();
  }
}
