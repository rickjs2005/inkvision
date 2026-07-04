"use client";

import { useRef, useState } from "react";
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
    <div className="flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative mx-auto max-w-md touch-none select-none overflow-hidden rounded-xl border border-border"
        onPointerMove={(e) => dragging && moveTo(e.clientX, e.clientY)}
        onPointerUp={() => setDragging(false)}
        onPointerLeave={() => setDragging(false)}
      >
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

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 text-muted-foreground">Tamanho</span>
          <input
            type="range"
            min={0.3}
            max={2.5}
            step={0.05}
            value={value.scale}
            onChange={(e) => onChange({ ...value, scale: Number(e.target.value) })}
            className="flex-1 accent-[var(--primary)]"
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <span className="w-16 text-muted-foreground">Rotação</span>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={value.rotation}
            onChange={(e) => onChange({ ...value, rotation: Number(e.target.value) })}
            className="flex-1 accent-[var(--primary)]"
          />
        </label>
        <p className="text-center text-xs text-muted-foreground">
          Arraste a arte para posicionar. Ajuste tamanho e rotação nos controles.
        </p>
      </div>
    </div>
  );
}
