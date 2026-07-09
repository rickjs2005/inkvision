import { parseInput } from "../../validate";
import { type Actor, assertAuthenticated } from "../../../domain/actor";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors";
import { generateSlots, type Slot } from "../../../domain/scheduling";
import { scheduleSessionSchema, type ScheduleSessionInput } from "../../dtos/schedule.dto";
import type { Appointment } from "../../ports/schedule-repository";
import { SCHEDULE_HORIZON_DAYS, SESSION_MINUTES } from "../../ports/schedule-repository";
import { sessionRescheduledEmail, sessionScheduledEmail } from "../../email/templates";
import type { ScheduleUseCaseDeps } from "./deps";

/** Horários disponíveis para agendar a sessão de um pedido. */
export class GetOrderSlotsUseCase {
  constructor(private readonly deps: ScheduleUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string): Promise<Slot[]> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");

    const now = this.deps.now();
    const to = new Date(now.getTime() + SCHEDULE_HORIZON_DAYS * 864e5);
    const [rules, busy] = await Promise.all([
      this.deps.schedule.getAvailability(order.artistId),
      this.deps.schedule.listBusy(order.studioId, order.artistId, now, to),
    ]);
    return generateSlots({ rules, busy, now, days: SCHEDULE_HORIZON_DAYS, slotMinutes: SESSION_MINUTES });
  }
}

/** Cliente agenda a sessão → SCHEDULED. Bloqueia conflito de horário. */
export class ScheduleSessionUseCase {
  constructor(private readonly deps: ScheduleUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string, rawInput: ScheduleSessionInput): Promise<Appointment> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== "SIMULATION_APPROVED") {
      throw new ValidationError("A simulação precisa estar aprovada para agendar.");
    }

    const { startsAt } = parseInput(scheduleSessionSchema, rawInput);
    if (startsAt.getTime() < this.deps.now().getTime()) {
      throw new ValidationError("Escolha um horário no futuro.");
    }
    const endsAt = new Date(startsAt.getTime() + SESSION_MINUTES * 60_000);

    if (await this.deps.schedule.hasConflict(order.studioId, order.artistId, startsAt, endsAt)) {
      throw new ConflictError("Este horário acabou de ser ocupado. Escolha outro.");
    }

    const appointment = await this.deps.schedule.createAppointment({
      studioId: order.studioId,
      orderId,
      artistId: order.artistId,
      clientId: actor.userId,
      startsAt,
      endsAt,
    });
    await this.deps.orders.transition(orderId, order.studioId, {
      from: "SIMULATION_APPROVED",
      to: "SCHEDULED",
      actorId: actor.userId,
      metadata: { startsAt: startsAt.toISOString() },
    });

    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "session.scheduled",
        payload: { orderId, startsAt: startsAt.toISOString(), artistId: artist.id },
      });
    }
    const client = await this.deps.users.findById(actor.userId);
    if (client) {
      // Best-effort: falha no provedor de e-mail não pode desfazer o agendamento já persistido.
      await this.deps.email
        .send(
          sessionScheduledEmail({
            to: client.email,
            clientName: client.name,
            artistName: artist?.name,
            startsAt,
            orderUrl: `${this.deps.appUrl}/pedidos/${orderId}`,
          }),
        )
        .catch(() => {});
    }
    return appointment;
  }
}

/** Cliente reagenda a sessão (pedido já SCHEDULED). */
export class RescheduleSessionUseCase {
  constructor(private readonly deps: ScheduleUseCaseDeps) {}
  async execute(actor: Actor | null, orderId: string, rawInput: ScheduleSessionInput): Promise<Appointment> {
    assertAuthenticated(actor);
    const order = await this.deps.orders.findByIdForClient(orderId, actor.userId);
    if (!order) throw new NotFoundError("Pedido");
    if (order.status !== "SCHEDULED") throw new ValidationError("Não há sessão agendada.");

    const appt = await this.deps.schedule.getAppointmentForOrder(order.studioId, orderId);
    if (!appt) throw new NotFoundError("Agendamento");

    const { startsAt } = parseInput(scheduleSessionSchema, rawInput);
    if (startsAt.getTime() < this.deps.now().getTime()) {
      throw new ValidationError("Escolha um horário no futuro.");
    }
    const endsAt = new Date(startsAt.getTime() + SESSION_MINUTES * 60_000);

    if (await this.deps.schedule.hasConflict(order.studioId, order.artistId, startsAt, endsAt, appt.id)) {
      throw new ConflictError("Este horário está ocupado. Escolha outro.");
    }

    const updated = await this.deps.schedule.reschedule(order.studioId, appt.id, startsAt, endsAt);
    const artist = await this.deps.artists.findById(order.artistId);
    if (artist) {
      await this.deps.notifications.create({
        userId: artist.userId,
        type: "session.rescheduled",
        payload: { orderId, startsAt: startsAt.toISOString(), artistId: artist.id },
      });
    }
    const client = await this.deps.users.findById(actor.userId);
    if (client) {
      await this.deps.email
        .send(
          sessionRescheduledEmail({
            to: client.email,
            clientName: client.name,
            artistName: artist?.name,
            startsAt,
            orderUrl: `${this.deps.appUrl}/pedidos/${orderId}`,
          }),
        )
        .catch(() => {});
    }
    return updated;
  }
}
