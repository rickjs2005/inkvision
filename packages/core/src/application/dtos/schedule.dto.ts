import { z } from "zod";

const ruleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startMin: z.number().int().min(0).max(1440),
  endMin: z.number().int().min(0).max(1440),
});

export const setAvailabilitySchema = z.object({
  rules: z
    .array(ruleSchema)
    .max(50)
    .refine((rs) => rs.every((r) => r.endMin > r.startMin), "Janela de horário inválida."),
});
export type SetAvailabilityInput = z.infer<typeof setAvailabilitySchema>;

export const addTimeOffSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().max(120).optional().nullable(),
  })
  .refine((v) => v.endsAt > v.startsAt, "Período inválido.");
export type AddTimeOffInput = z.infer<typeof addTimeOffSchema>;

export const scheduleSessionSchema = z.object({
  startsAt: z.coerce.date(),
});
export type ScheduleSessionInput = z.infer<typeof scheduleSessionSchema>;
