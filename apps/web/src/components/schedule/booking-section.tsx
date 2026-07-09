"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
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
  status: "SIMULATION_APPROVED" | "SCHEDULED" | "SESSION_DONE";
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

  if ((status === "SCHEDULED" || status === "SESSION_DONE") && appointmentStartsAt && !rescheduling) {
    const d = new Date(appointmentStartsAt);
    return (
      <div className="flex flex-col gap-5">
        <span className="eyebrow">{status === "SESSION_DONE" ? "Sessão realizada" : "Sessão confirmada"}</span>
        <div className="flex items-start gap-4 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-ink)]">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CalendarCheck className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl font-light capitalize leading-tight tracking-[-0.02em]">
              {dayFmt.format(d)}
            </p>
            <p className="mt-1 font-mono text-sm text-muted-foreground">às {timeFmt.format(d)}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {status === "SESSION_DONE"
            ? "O tatuador confirmou a sessão — falta o pagamento final para concluir."
            : "Falta o pagamento final para concluir — o botão aparece acima."}
        </p>
        {status === "SCHEDULED" && (
          <div className="border-t border-border pt-4">
            <Button size="sm" variant="outline" onClick={() => setRescheduling(true)}>
              Reagendar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="eyebrow">{rescheduling ? "Reagendar" : "Agendar sessão"}</span>
        <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
          {rescheduling ? "Escolha um novo horário" : "Escolha um horário"}
        </h3>
      </div>
      {byDay.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-5 py-6 text-sm text-muted-foreground">
          O tatuador ainda não publicou horários disponíveis. Combine pelo chat.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border border-t border-border">
          {byDay.map(([day, isos]) => (
            <div key={day} className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <p className="pt-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {day}
              </p>
              <div className="flex flex-wrap gap-2">
                {isos.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    disabled={pending}
                    onClick={() => pick(iso)}
                    className={cn(
                      "rounded-md border border-border bg-card px-3.5 py-1.5 font-mono text-sm tabular-nums transition-all",
                      "hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-[var(--shadow-ink)]",
                      "disabled:pointer-events-none disabled:opacity-50",
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
        <div>
          <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
            Cancelar
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
