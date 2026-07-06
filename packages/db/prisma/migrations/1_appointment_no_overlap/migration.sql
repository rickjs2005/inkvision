-- Backstop atômico contra overbooking.
--
-- O caso de uso de agendamento faz check-then-insert (verifica conflito e depois
-- insere), o que é uma race condition: dois clientes podem passar pela verificação
-- ao mesmo tempo e ambos reservar o mesmo horário do mesmo artista.
--
-- Esta constraint de exclusão é a última linha de defesa — garantida pelo próprio
-- Postgres de forma atômica ao COMMIT/INSERT. Ela impede, no nível do banco, que
-- existam dois agendamentos ATIVOS (CONFIRMED/RESCHEDULED) do mesmo artista cujos
-- intervalos [startsAt, endsAt) se sobreponham. Agendamentos DONE/NO_SHOW/CANCELLED
-- ficam de fora (WHERE), pois não ocupam a agenda.

-- Necessária para usar operadores de igualdade (=) em índices GiST junto com &&.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- `startsAt`/`endsAt` são `timestamp` SEM fuso (mapeamento default do Prisma
-- para `DateTime` sem `@db.Timestamptz`). `tsrange()` (sem fuso) é o construtor
-- correto para esse tipo e é IMMUTABLE de verdade — diferente de `tstzrange()`,
-- que exigiria um cast timestamp→timestamptz dependente do fuso da SESSÃO
-- (STABLE, não IMMUTABLE) e o Postgres rejeita isso em expressão de índice.
ALTER TABLE "Appointment"
  ADD CONSTRAINT appointment_no_overlap
  EXCLUDE USING gist (
    "artistId" WITH =,
    tsrange("startsAt", "endsAt") WITH &&
  )
  WHERE (status IN ('CONFIRMED', 'RESCHEDULED'));
