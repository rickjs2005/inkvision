"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { SimulationPlacement } from "@inkvision/core";
import { cn } from "@/lib/utils";

const SIZES = [
  { key: "small", label: "P", mult: 0.7 },
  { key: "medium", label: "M", mult: 1 },
  { key: "large", label: "G", mult: 1.3 },
] as const;

/**
 * Compõe a arte sobre a foto do corpo no cliente (funciona com o provider mock).
 * Um provider real entregaria imagens já compostas; aqui sobrepomos com o
 * placement + escala P/M/G e blend "multiply" para dar aparência na pele.
 */
export function SimulationView({
  bodyPhotoUrl,
  designUrl,
  placement,
}: {
  bodyPhotoUrl: string;
  designUrl: string;
  placement: SimulationPlacement;
}) {
  const [size, setSize] = useState<(typeof SIZES)[number]>(SIZES[1]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {/* Moldura do resultado — papel com hairline e sombra */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">O resultado · prévia com IA</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
            <Sparkles className="size-3" />
            simulação
          </span>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]">
          <div className="relative overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bodyPhotoUrl} alt="Foto do corpo" className="w-full" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={designUrl}
              alt="Arte"
              className="pointer-events-none absolute mix-blend-multiply"
              style={{
                left: `${placement.x * 100}%`,
                top: `${placement.y * 100}%`,
                width: `${28 * placement.scale * size.mult}%`,
                transform: `translate(-50%, -50%) rotate(${placement.rotation}deg)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Seletor de variante P/M/G */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="eyebrow">Tamanho</span>
        <div className="flex gap-2">
          {SIZES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size.key === s.key}
              className={cn(
                "size-9 rounded-md border font-mono text-sm transition-colors",
                size.key === s.key
                  ? "border-primary bg-primary/10 text-primary shadow-[var(--shadow-ink)]"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
