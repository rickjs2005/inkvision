/**
 * Geração de horários disponíveis (pura, testável). Trabalha em UTC — a UI
 * exibe no fuso local. Uma sessão ocupa `slotMinutes`; um horário só é ofertado
 * se cabe inteiro numa janela de disponibilidade, está no futuro e não colide
 * com nenhum intervalo ocupado (agendamentos + folgas).
 */
export interface AvailabilityRule {
  weekday: number; // 0=domingo … 6=sábado (UTC)
  startMin: number; // minutos desde 00:00
  endMin: number;
}

export interface BusyInterval {
  startsAt: Date;
  endsAt: Date;
}

export interface Slot {
  startsAt: Date;
  endsAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlots(params: {
  rules: AvailabilityRule[];
  busy: BusyInterval[];
  now: Date;
  days: number;
  slotMinutes: number;
}): Slot[] {
  const { rules, busy, now, days, slotMinutes } = params;
  if (rules.length === 0 || slotMinutes <= 0) return [];

  const busyMs = busy.map((b) => [b.startsAt.getTime(), b.endsAt.getTime()] as const);
  const nowMs = now.getTime();
  const slots: Slot[] = [];

  // Começa da meia-noite UTC de hoje.
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const dayStart = startOfToday + dayOffset * DAY_MS;
    const weekday = new Date(dayStart).getUTCDay();
    for (const rule of rules) {
      if (rule.weekday !== weekday) continue;
      for (let min = rule.startMin; min + slotMinutes <= rule.endMin; min += slotMinutes) {
        const s = dayStart + min * 60_000;
        const e = s + slotMinutes * 60_000;
        if (s < nowMs) continue; // passado
        if (busyMs.some(([bs, be]) => overlaps(s, e, bs, be))) continue;
        slots.push({ startsAt: new Date(s), endsAt: new Date(e) });
      }
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
