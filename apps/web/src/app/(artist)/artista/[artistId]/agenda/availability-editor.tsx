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
    <div className="flex flex-col gap-3">
      {days.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <label className="flex w-32 items-center gap-2 text-sm">
            <input type="checkbox" checked={d.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} className="size-4" />
            {WEEKDAYS[i]}
          </label>
          <input
            type="time"
            value={d.start}
            disabled={!d.enabled}
            onChange={(e) => update(i, { start: e.target.value })}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-40"
          />
          <span className="text-muted-foreground">até</span>
          <input
            type="time"
            value={d.end}
            disabled={!d.enabled}
            onChange={(e) => update(i, { end: e.target.value })}
            className="h-9 rounded-md border border-input bg-transparent px-2 text-sm disabled:opacity-40"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar disponibilidade"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        Sessões de 2h são ofertadas dentro das janelas. Horários já ocupados não aparecem para o cliente.
      </p>
    </div>
  );
}
