import type { ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { ScheduleRepository } from "../../ports/schedule-repository";
import type { NotificationRepository } from "../../ports/notification-repository";
import type { EmailService } from "../../ports/email-service";
import type { UserRepository } from "../../ports/user-repository";

export interface ScheduleUseCaseDeps {
  schedule: ScheduleRepository;
  orders: OrderRepository;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
  users: Pick<UserRepository, "findById">;
  email: EmailService;
  /** URL pública do app (para links nos e-mails). */
  appUrl: string;
  /** Relógio injetável (testes passam um fixo). */
  now: () => Date;
}
