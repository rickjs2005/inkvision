-- Marca quando o lembrete de sessão (24h antes) foi enviado, para o job de
-- lembretes (apps/worker) não reenviar o mesmo e-mail a cada varredura.

ALTER TABLE "Appointment" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

CREATE INDEX "Appointment_reminderSentAt_startsAt_idx" ON "Appointment"("reminderSentAt", "startsAt");
