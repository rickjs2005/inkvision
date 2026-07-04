"use client";

import { useRef, useState } from "react";
import { Move } from "lucide-react";
import type { SimulationPlacement } from "@inkvision/core";
import { cn } from "@/lib/utils";

/**
 * Editor de posicionamento: arraste a arte sobre a foto, ajuste escala e rotação.
 * Produz um placement {x,y,scale,rotation} que é enviado ao gerar a simulação.
 * A composição visual usa a mesma lógica do resultado (blend "multiply").
 */
export function SimulationEditor({
  bodyPhotoUrl,
  designUrl,
  value,
  onChange,
}: {
  bodyPhotoUrl: string;
  designUrl: string;
  value: SimulationPlacement;
  onChange: (p: SimulationPlacement) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function moveTo(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    onChange({ ...value, x, y });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Palco — superfície de papel com hairline e sombra de tinta */}
      <div className="mx-auto w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">O palco · posicionamento</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Move className="size-3" />
            arraste a arte
          </span>
        </div>
        <div
          ref={containerRef}
          className="relative touch-none select-none overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-ink)]"
          onPointerMove={(e) => dragging && moveTo(e.clientX, e.clientY)}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          <div className="relative overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bodyPhotoUrl} alt="Foto do corpo" className="w-full" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={designUrl}
              alt="Arte"
              draggable={false}
              onPointerDown={(e) => {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
                setDragging(true);
              }}
              className={cn(
                "absolute mix-blend-multiply",
                dragging ? "cursor-grabbing ring-2 ring-primary" : "cursor-grab",
              )}
              style={{
                left: `${value.x * 100}%`,
                top: `${value.y * 100}%`,
                width: `${28 * value.scale}%`,
                transform: `translate(-50%, -50%) rotate(${value.rotation}deg)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Controles — trilha refinada, rótulos eyebrow, valores em mono */}
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 border-t border-border pt-5">
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between">
            <span className="eyebrow">Tamanho</span>
            <span className="font-mono text-xs text-foreground">{value.scale.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.05}
            value={value.scale}
            onChange={(e) => onChange({ ...value, scale: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)]"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="flex items-center justify-between">
            <span className="eyebrow">Rotação</span>
            <span className="font-mono text-xs text-foreground">
              {value.rotation > 0 ? "+" : ""}
              {Math.round(value.rotation)}°
            </span>
          </span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={value.rotation}
            onChange={(e) => onChange({ ...value, rotation: Number(e.target.value) })}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)]"
          />
        </label>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Arraste a arte sobre a foto para posicionar. Ajuste tamanho e rotação nos controles acima.
        </p>
      </div>
    </div>
  );
}
