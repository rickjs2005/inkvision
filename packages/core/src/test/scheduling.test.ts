import { beforeEach, describe, expect, it } from "vitest";
import type { Actor } from "../domain/actor";
import { generateSlots, type AvailabilityRule, type BusyInterval } from "../domain/scheduling";
import type {
  Appointment,
  CreateAppointmentData,
  ScheduleRepository,
  TimeOffData,
  TimeOffItem,
} from "../application/ports/schedule-repository";
import { ScheduleSessionUseCase } from "../application/use-cases/schedule/booking";
import { SendSessionRemindersUseCase } from "../application/use-cases/schedule/reminders";
import { InMemoryEmailService, InMemoryUserRepo } from "./fakes";
import { InMemoryArtistRepo } from "./fakes-artist";
import { InMemoryNotificationRepo, InMemoryOrderRepo } from "./fakes-order";

const MON = new Date("2026-01-05T00:00:00Z"); // segunda-feira UTC

describe("generateSlots", () => {
  const rules: AvailabilityRule[] = [{ weekday: 1, startMin: 600, endMin: 1080 }]; // seg 10h–18h

  it("gera slots de 2h dentro da janela", () => {
    const slots = generateSlots({ rules, busy: [], now: MON, days: 1, slotMinutes: 120 });
    expect(slots.length).toBe(4); // 10,12,14,16
    expect(slots[0]!.startsAt.toISOString()).toBe("2026-01-05T10:00:00.000Z");
  });

  it("exclui horários ocupados", () => {
    const busy: BusyInterval[] = [
      { startsAt: new Date("2026-01-05T10:00:00Z"), endsAt: new Date("2026-01-05T12:00:00Z") },
    ];
    const slots = generateSlots({ rules, busy, now: MON, days: 1, slotMinutes: 120 });
    expect(slots.length).toBe(3);
    expect(slots[0]!.startsAt.toISOString()).toBe("2026-01-05T12:00:00.000Z");
  });

  it("não oferta horários no passado", () => {
    const noon = new Date("2026-01-05T13:00:00Z");
    const slots = generateSlots({ rules, busy: [], now: noon, days: 1, slotMinutes: 120 });
    expect(slots.every((s) => s.startsAt.getTime() >= noon.getTime())).toBe(true);
  });
});

class InMemoryScheduleRepo implements ScheduleRepository {
  appts: Appointment[] = [];
  rules: AvailabilityRule[] = [];
  async setAvailability(_a: string, rules: AvailabilityRule[]) {
    this.rules = rules;
  }
  async getAvailability() {
    return this.rules;
  }
  async addTimeOff(_a: string, d: TimeOffData): Promise<TimeOffItem> {
    return { id: "t1", ...d };
  }
  async listTimeOff() {
    return [];
  }
  async removeTimeOff() {}
  async listBusy() {
    return this.appts.map((a) => ({ startsAt: a.startsAt, endsAt: a.endsAt }));
  }
  async hasConflict(_s: string, artistId: string, startsAt: Date, endsAt: Date, exclude?: string) {
    return this.appts.some(
      (a) => a.artistId === artistId && a.id !== exclude && a.startsAt < endsAt && startsAt < a.endsAt,
    );
  }
  async createAppointment(d: CreateAppointmentData): Promise<Appointment> {
    const a: Appointment = { id: `ap_${this.appts.length + 1}`, status: "CONFIRMED", reminderSentAt: null, ...d };
    this.appts.push(a);
    return a;
  }
  async getAppointmentForOrder(_s: string, orderId: string) {
    return this.appts.find((a) => a.orderId === orderId) ?? null;
  }
  async reschedule(_s: string, id: string, startsAt: Date, endsAt: Date) {
    const a = this.appts.find((x) => x.id === id)!;
    a.startsAt = startsAt;
    a.endsAt = endsAt;
    a.status = "RESCHEDULED";
    return a;
  }
  async listAppointmentsNeedingReminder(from: Date, to: Date) {
    return this.appts.filter(
      (a) =>
        !a.reminderSentAt &&
        (a.status === "CONFIRMED" || a.status === "RESCHEDULED") &&
        a.startsAt > from &&
        a.startsAt <= to,
    );
  }
  async markReminderSent(id: string) {
    const a = this.appts.find((x) => x.id === id);
    if (a) a.reminderSentAt = new Date();
  }
}

const STUDIO = "studio_1";
const client: Actor = { userId: "u_client", platformRole: "USER", memberships: [] };

describe("ScheduleSession", () => {
  let orders: InMemoryOrderRepo;
  let schedule: InMemoryScheduleRepo;
  let artists: InMemoryArtistRepo;
  let notifications: InMemoryNotificationRepo;
  let users: InMemoryUserRepo;
  let email: InMemoryEmailService;
  let orderId: string;

  beforeEach(async () => {
    orders = new InMemoryOrderRepo();
    schedule = new InMemoryScheduleRepo();
    artists = new InMemoryArtistRepo();
    notifications = new InMemoryNotificationRepo();
    users = new InMemoryUserRepo([{ id: "u_client", name: "Cliente", email: "cliente@teste.com" }]);
    email = new InMemoryEmailService();
    const artist = artists.seed({ userId: "u_artist", studioId: STUDIO });
    const order = await orders.create({
      studioId: STUDIO,
      clientId: "u_client",
      artistId: artist.id,
      bodyPart: "braço",
      briefing: "x".repeat(12),
      references: [],
    });
    order.status = "SIMULATION_APPROVED";
    orderId = order.id;
  });

  const deps = () => ({ schedule, orders, artists, notifications, users, email, appUrl: "https://inkvision.app", now: () => MON });

  it("agenda a sessão → SCHEDULED e notifica o tatuador", async () => {
    const appt = await new ScheduleSessionUseCase(deps()).execute(client, orderId, {
      startsAt: new Date("2026-01-05T10:00:00Z"),
    });
    expect(appt.status).toBe("CONFIRMED");
    expect(orders.orders[0]!.status).toBe("SCHEDULED");
    expect(await notifications.countUnread("u_artist")).toBe(1);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]!.to).toBe("cliente@teste.com");
  });

  it("bloqueia horário em conflito", async () => {
    await new ScheduleSessionUseCase(deps()).execute(client, orderId, { startsAt: new Date("2026-01-05T10:00:00Z") });
    // outro pedido do mesmo artista tentando o mesmo horário
    const o2 = await orders.create({ studioId: STUDIO, clientId: "u_client", artistId: artists.artists[0]!.id, bodyPart: "perna", briefing: "y".repeat(12), references: [] });
    o2.status = "SIMULATION_APPROVED";
    await expect(
      new ScheduleSessionUseCase(deps()).execute(client, o2.id, { startsAt: new Date("2026-01-05T11:00:00Z") }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("não agenda se a simulação não foi aprovada", async () => {
    orders.orders[0]!.status = "IN_DESIGN";
    await expect(
      new ScheduleSessionUseCase(deps()).execute(client, orderId, { startsAt: new Date("2026-01-05T10:00:00Z") }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  describe("SendSessionReminders", () => {
    it("lembra sessões nas próximas 24h e marca como avisadas (uma vez só)", async () => {
      await new ScheduleSessionUseCase(deps()).execute(client, orderId, {
        startsAt: new Date("2026-01-05T20:00:00Z"), // 20h depois de MON (2026-01-05T00:00:00Z)
      });
      email.sent = []; // limpa o e-mail da própria confirmação de agendamento

      const remindersDeps = { schedule, orders, artists, users, email, appUrl: "https://inkvision.app", now: () => MON };
      const sent = await new SendSessionRemindersUseCase(remindersDeps).execute();
      expect(sent).toBe(1);
      expect(email.sent).toHaveLength(1);
      expect(email.sent[0]!.to).toBe("cliente@teste.com");

      const again = await new SendSessionRemindersUseCase(remindersDeps).execute();
      expect(again).toBe(0);
      expect(email.sent).toHaveLength(1);
    });

    it("ignora sessões fora da janela de 24h", async () => {
      await new ScheduleSessionUseCase(deps()).execute(client, orderId, {
        startsAt: new Date("2026-01-10T09:00:00Z"), // dias depois de MON
      });
      email.sent = [];

      const remindersDeps = { schedule, orders, artists, users, email, appUrl: "https://inkvision.app", now: () => MON };
      const sent = await new SendSessionRemindersUseCase(remindersDeps).execute();
      expect(sent).toBe(0);
      expect(email.sent).toHaveLength(0);
    });
  });
});
