import type { ArtistRepository } from "../../ports/artist-repository";
import type { OrderRepository } from "../../ports/order-repository";
import type { ScheduleRepository } from "../../ports/schedule-repository";
import { REMINDER_LEAD_HOURS } from "../../ports/schedule-repository";
import type { EmailService } from "../../ports/email-service";
import type { UserRepository } from "../../ports/user-repository";
import { sessionReminderEmail } from "../../email/templates";

export interface SessionReminderDeps {
  schedule: ScheduleRepository;
  orders: Pick<OrderRepository, "findByIdForStudio">;
  artists: Pick<ArtistRepository, "findById">;
  users: Pick<UserRepository, "findById">;
  email: EmailService;
  appUrl: string;
  now: () => Date;
}

/**
 * Varredura periódica (worker): manda o lembrete de sessão a quem tem
 * agendamento nas próximas `REMINDER_LEAD_HOURS` horas e ainda não foi
 * avisado. Chamada repetidamente — cada agendamento só recebe um lembrete
 * porque `markReminderSent` é gravado assim que o e-mail é despachado.
 */
export class SendSessionRemindersUseCase {
  constructor(private readonly deps: SessionReminderDeps) {}

  async execute(): Promise<number> {
    const now = this.deps.now();
    const before = new Date(now.getTime() + REMINDER_LEAD_HOURS * 3_600_000);
    const due = await this.deps.schedule.listAppointmentsNeedingReminder(now, before);

    let sent = 0;
    for (const appt of due) {
      const [order, client] = await Promise.all([
        this.deps.orders.findByIdForStudio(appt.orderId, appt.studioId),
        this.deps.users.findById(appt.clientId),
      ]);
      if (client) {
        const artist = order ? await this.deps.artists.findById(order.artistId) : null;
        await this.deps.email
          .send(
            sessionReminderEmail({
              to: client.email,
              clientName: client.name,
              artistName: artist?.name,
              startsAt: appt.startsAt,
              orderUrl: `${this.deps.appUrl}/pedidos/${appt.orderId}`,
            }),
          )
          .catch(() => {});
        sent++;
      }
      await this.deps.schedule.markReminderSent(appt.id);
    }
    return sent;
  }
}
