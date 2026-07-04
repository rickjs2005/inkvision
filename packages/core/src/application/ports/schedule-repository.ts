import type { AvailabilityRule, BusyInterval } from "../../domain/scheduling";

export type AppointmentStatus = "CONFIRMED" | "RESCHEDULED" | "DONE" | "NO_SHOW" | "CANCELLED";

export interface TimeOffData {
  startsAt: Date;
  endsAt: Date;
  reason?: string | null;
}
export interface TimeOffItem extends TimeOffData {
  id: string;
}

export interface Appointment {
  id: string;
  studioId: string;
  orderId: string;
  artistId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
  status: AppointmentStatus;
}

export interface CreateAppointmentData {
  studioId: string;
  orderId: string;
  artistId: string;
  clientId: string;
  startsAt: Date;
  endsAt: Date;
}

export interface ScheduleRepository {
  // Disponibilidade e folgas (por artista; não tenant-scoped).
  setAvailability(artistId: string, rules: AvailabilityRule[]): Promise<void>;
  getAvailability(artistId: string): Promise<AvailabilityRule[]>;
  addTimeOff(artistId: string, data: TimeOffData): Promise<TimeOffItem>;
  listTimeOff(artistId: string): Promise<TimeOffItem[]>;
  removeTimeOff(artistId: string, id: string): Promise<void>;

  // Agendamentos (tenant-scoped).
  listBusy(studioId: string, artistId: string, from: Date, to: Date): Promise<BusyInterval[]>;
  hasConflict(
    studioId: string,
    artistId: string,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<boolean>;
  createAppointment(data: CreateAppointmentData): Promise<Appointment>;
  getAppointmentForOrder(studioId: string, orderId: string): Promise<Appointment | null>;
  reschedule(studioId: string, appointmentId: string, startsAt: Date, endsAt: Date): Promise<Appointment>;
}

/** Duração padrão de uma sessão (min). Simplificação — futuro: por pedido/estúdio. */
export const SESSION_MINUTES = 120;
/** Horizonte de agendamento (dias à frente). */
export const SCHEDULE_HORIZON_DAYS = 21;
