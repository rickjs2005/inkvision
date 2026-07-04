"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rescheduleSessionAction, scheduleSessionAction } from "@/server/actions/schedule";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const dayFmt = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
const timeFmt = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

export function BookingSection({
  orderId,
  status,
  slots,
  appointmentStartsAt,
}: {
  orderId: string;
  status: "SIMULATION_APPROVED" | "SCHEDULED";
  slots: string[]; // ISO
  appointmentStartsAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);

  const byDay = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const iso of slots) {
      const key = dayFmt.format(new Date(iso));
      const arr = groups.get(key) ?? [];
      arr.push(iso);
      groups.set(key, arr);
    }
    return [...groups.entries()].slice(0, 8);
  }, [slots]);

  function pick(iso: string) {
    setError(null);
    startTransition(async () => {
      const res = rescheduling
        ? await rescheduleSessionAction(orderId, iso)
        : await scheduleSessionAction(orderId, iso);
      if (res.ok) {
        setRescheduling(false);
        router.refresh();
      } else setError(res.error);
    });
  }

  if (status === "SCHEDULED" && appointmentStartsAt && !rescheduling) {
    const d = new Date(appointmentStartsAt);
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm">
          Sessão agendada para{" "}
          <span className="font-medium">
            {dayFmt.format(d)} às {timeFmt.format(d)}
          </span>
          .
        </p>
        <p className="text-sm text-muted-foreground">
          Falta o pagamento final para concluir — o botão aparece acima.
        </p>
        <div>
          <Button size="sm" variant="outline" onClick={() => setRescheduling(true)}>
            Reagendar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {rescheduling ? "Escolha um novo horário:" : "Escolha um horário para a sessão:"}
      </p>
      {byDay.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          O tatuador ainda não publicou horários disponíveis. Combine pelo chat.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {byDay.map(([day, isos]) => (
            <div key={day}>
              <p className="mb-2 text-sm font-medium capitalize">{day}</p>
              <div className="flex flex-wrap gap-2">
                {isos.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    disabled={pending}
                    onClick={() => pick(iso)}
                    className={cn(
                      "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary disabled:opacity-50",
                    )}
                  >
                    {timeFmt.format(new Date(iso))}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {rescheduling && (
        <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
          Cancelar
        </Button>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
