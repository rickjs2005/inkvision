"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AvailabilityRule } from "@inkvision/core";
import { setAvailabilityAction } from "@/server/actions/schedule";
import { Button } from "@/components/ui/button";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};

interface DayState {
  enabled: boolean;
  start: string;
  end: string;
}

export function AvailabilityEditor({
  artistId,
  initial,
}: {
  artistId: string;
  initial: AvailabilityRule[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [days, setDays] = useState<DayState[]>(() =>
    WEEKDAYS.map((_, wd) => {
      const rule = initial.find((r) => r.weekday === wd);
      return rule
        ? { enabled: true, start: toHHMM(rule.startMin), end: toHHMM(rule.endMin) }
        : { enabled: false, start: "10:00", end: "18:00" };
    }),
  );

  function update(i: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function save() {
    setMsg(null);
    const rules: AvailabilityRule[] = days
      .map((d, wd) => ({ d, wd }))
      .filter(({ d }) => d.enabled && toMin(d.end) > toMin(d.start))
      .map(({ d, wd }) => ({ weekday: wd, startMin: toMin(d.start), endMin: toMin(d.end) }));
    startTransition(async () => {
      const res = await setAvailabilityAction(artistId, rules);
      if (res.ok) {
        setMsg("Disponibilidade salva.");
        router.refresh();
      } else setMsg(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-border pb-2 sm:grid-cols-[12rem_1fr]">
        <span className="eyebrow">Dia</span>
        <span className="eyebrow">Janela de atendimento</span>
      </div>

      <div className="flex flex-col">
        {days.map((d, i) => (
          <div
            key={i}
            className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 border-b border-border py-3 sm:grid-cols-[12rem_1fr]"
          >
            <label className="flex cursor-pointer items-center gap-3 select-none">
              <input
                type="checkbox"
                checked={d.enabled}
                onChange={(e) => update(i, { enabled: e.target.checked })}
                className="size-4 accent-primary"
              />
              <span
                className={
                  d.enabled
                    ? "text-sm font-medium text-foreground"
                    : "text-sm text-muted-foreground"
                }
              >
                {WEEKDAYS[i]}
              </span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="time"
                value={d.start}
                disabled={!d.enabled}
                onChange={(e) => update(i, { start: e.target.value })}
                className="h-11 rounded-md border border-input bg-background/40 px-2.5 font-mono text-sm tabular-nums transition-[border-color,box-shadow] focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:opacity-40"
              />
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                até
              </span>
              <input
                type="time"
                value={d.end}
                disabled={!d.enabled}
                onChange={(e) => update(i, { end: e.target.value })}
                className="h-11 rounded-md border border-input bg-background/40 px-2.5 font-mono text-sm tabular-nums transition-[border-color,box-shadow] focus-visible:border-primary/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12 disabled:opacity-40"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar disponibilidade"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Sessões de 2h são ofertadas dentro das janelas. Horários já ocupados não aparecem para o
        cliente.
      </p>
    </div>
  );
}
