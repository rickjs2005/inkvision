import type { ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { ScheduleRepository } from "../../ports/schedule-repository";
import type { NotificationRepository } from "../../ports/notification-repository";

export interface ScheduleUseCaseDeps {
  schedule: ScheduleRepository;
  orders: OrderRepository;
  artists: Pick<ArtistRepository, "findById">;
  notifications: NotificationRepository;
  /** Relógio injetável (testes passam um fixo). */
  now: () => Date;
}
