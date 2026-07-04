"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import type { Style } from "@inkvision/core";
import { setArtistStylesAction } from "@/server/actions/artist";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function StylesSelector({
  artistId,
  allStyles,
  selectedIds,
}: {
  artistId: string;
  allStyles: Style[];
  selectedIds: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function save() {
    setMsg(null);
    startTransition(async () => {
      const res = await setArtistStylesAction(artistId, [...selected]);
      setOk(res.ok);
      setMsg(res.ok ? "Estilos salvos" : res.error);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <span className="eyebrow">Especialidades</span>
        <span className="font-mono text-xs text-muted-foreground">
          {String(selected.size).padStart(2, "0")} / {String(allStyles.length).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {allStyles.map((s) => {
          const active = selected.has(s.id);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={active}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-sm border px-3.5 py-1.5 text-[13px] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-px",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-ink)]"
                  : "border-border text-muted-foreground hover:-translate-y-0.5 hover:border-foreground/35 hover:text-foreground",
              )}
            >
              <Check
                className={cn(
                  "size-3.5 transition-all duration-200",
                  active ? "scale-100 opacity-100" : "-ml-1.5 w-0 scale-0 opacity-0",
                )}
                strokeWidth={2.5}
              />
              {s.name}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-4">
        <Button size="sm" onClick={save} disabled={pending}>
          {pending ? "Salvando…" : "Salvar estilos"}
        </Button>
        {msg &&
          (ok ? (
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-emerald-500">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {msg}
            </span>
          ) : (
            <span className="text-sm text-destructive">{msg}</span>
          ))}
      </div>
    </div>
  );
}
