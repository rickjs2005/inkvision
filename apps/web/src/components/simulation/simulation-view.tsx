"use client";

import { useState } from "react";
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
    <div className="flex flex-col gap-3">
      <div className="relative mx-auto max-w-md overflow-hidden rounded-xl border border-border">
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
      <div className="flex justify-center gap-2">
        {SIZES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSize(s)}
            className={cn(
              "size-9 rounded-full border text-sm font-medium",
              size.key === s.key ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
