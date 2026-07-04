import { prisma, withStudio } from "@inkvision/db";
import type { AvailabilityRule, BusyInterval } from "@inkvision/core";
import type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentData,
  ScheduleRepository,
  TimeOffData,
  TimeOffItem,
} from "@inkvision/core";

const ACTIVE_APPT = ["CONFIRMED", "RESCHEDULED"] as const;

function apptToDomain(a: {
  id: string;
  studioId: string;
  orderId: string;
  artistId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
}): Appointment {
  return { ...a, status: a.status as AppointmentStatus };
}

export class PrismaScheduleRepository implements ScheduleRepository {
  // ── Disponibilidade / folgas (por artista, sem RLS) ──
  async setAvailability(artistId: string, rules: AvailabilityRule[]): Promise<void> {
    await prisma.$transaction([
      prisma.availabilityRule.deleteMany({ where: { artistId } }),
      prisma.availabilityRule.createMany({
        data: rules.map((r) => ({ artistId, weekday: r.weekday, startMin: r.startMin, endMin: r.endMin })),
      }),
    ]);
  }

  async getAvailability(artistId: string): Promise<AvailabilityRule[]> {
    const rows = await prisma.availabilityRule.findMany({
      where: { artistId },
      orderBy: [{ weekday: "asc" }, { startMin: "asc" }],
      select: { weekday: true, startMin: true, endMin: true },
    });
    return rows;
  }

  async addTimeOff(artistId: string, data: TimeOffData): Promise<TimeOffItem> {
    const t = await prisma.timeOff.create({
      data: { artistId, startsAt: data.startsAt, endsAt: data.endsAt, reason: data.reason ?? null },
    });
    return { id: t.id, startsAt: t.startsAt, endsAt: t.endsAt, reason: t.reason };
  }

  async listTimeOff(artistId: string): Promise<TimeOffItem[]> {
    const rows = await prisma.timeOff.findMany({ where: { artistId }, orderBy: { startsAt: "asc" } });
    return rows.map((t) => ({ id: t.id, startsAt: t.startsAt, endsAt: t.endsAt, reason: t.reason }));
  }

  async removeTimeOff(artistId: string, id: string): Promise<void> {
    await prisma.timeOff.deleteMany({ where: { id, artistId } });
  }

  // ── Agendamentos (tenant-scoped) ──
  async listBusy(studioId: string, artistId: string, from: Date, to: Date): Promise<BusyInterval[]> {
    const appts = await withStudio(studioId, (tx) =>
      tx.appointment.findMany({
        where: {
          artistId,
          status: { in: [...ACTIVE_APPT] },
          startsAt: { lt: to },
          endsAt: { gt: from },
        },
        select: { startsAt: true, endsAt: true },
      }),
    );
    const offs = await prisma.timeOff.findMany({
      where: { artistId, startsAt: { lt: to }, endsAt: { gt: from } },
      select: { startsAt: true, endsAt: true },
    });
    return [...appts, ...offs];
  }

  async hasConflict(
    studioId: string,
    artistId: string,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean> {
    const appt = await withStudio(studioId, (tx) =>
      tx.appointment.count({
        where: {
          artistId,
          status: { in: [...ACTIVE_APPT] },
          startsAt: { lt: endsAt },
          endsAt: { gt: startsAt },
          ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
        },
      }),
    );
    if (appt > 0) return true;
    const off = await prisma.timeOff.count({
      where: { artistId, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } },
    });
    return off > 0;
  }

  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    const a = await withStudio(data.studioId, (tx) =>
      tx.appointment.create({
        data: {
          studioId: data.studioId,
          orderId: data.orderId,
          artistId: data.artistId,
          clientId: data.clientId,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: "CONFIRMED",
        },
      }),
    );
    return apptToDomain(a);
  }

  async getAppointmentForOrder(studioId: string, orderId: string): Promise<Appointment | null> {
    const a = await withStudio(studioId, (tx) => tx.appointment.findFirst({ where: { orderId } }));
    return a ? apptToDomain(a) : null;
  }

  async reschedule(studioId: string, appointmentId: string, startsAt: Date, endsAt: Date): Promise<Appointment> {
    const a = await withStudio(studioId, (tx) =>
      tx.appointment.update({
        where: { id: appointmentId },
        data: { startsAt, endsAt, status: "RESCHEDULED" },
      }),
    );
    return apptToDomain(a);
  }
}
