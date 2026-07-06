"use client";

import { useRef, useState } from "react";
import { Move } from "lucide-react";
import type { SimulationPlacement } from "@inkvision/core";
import { cn } from "@/lib/utils";

/**
 * Editor de posicionamento: a arte REAL enviada pelo tatuador sobre a foto do
 * corpo do cliente. Gestos iguais ao /simular público — 1 dedo posiciona/
 * arrasta em qualquer ponto da foto; 2 dedos (pinça) ajustam tamanho e giro.
 * Produz um placement {x,y,scale,rotation} enviado ao gerar a simulação.
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
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchBase = useRef<{ dist: number; angle: number; scale: number; rotation: number } | null>(
    null,
  );

  function moveTo(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    onChange({ ...value, x, y });
  }

  function pinchOf(): { dist: number; angle: number } {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.hypot(b!.x - a!.x, b!.y - a!.y),
      angle: (Math.atan2(b!.y - a!.y, b!.x - a!.x) * 180) / Math.PI,
    };
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    // Captura é otimização (não perder o arrasto na borda) — nunca aborta o gesto.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* segue sem captura */
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      setDragging(true);
      moveTo(e.clientX, e.clientY);
    } else if (pointers.current.size === 2) {
      setDragging(false);
      const { dist, angle } = pinchOf();
      pinchBase.current = { dist, angle, scale: value.scale, rotation: value.rotation };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchBase.current) {
      const base = pinchBase.current;
      const { dist, angle } = pinchOf();
      let rotation = base.rotation + (angle - base.angle);
      rotation = ((rotation + 540) % 360) - 180;
      onChange({
        ...value,
        scale: Math.min(2.5, Math.max(0.3, (base.scale * dist) / Math.max(base.dist, 1))),
        rotation,
      });
    } else if (dragging) {
      moveTo(e.clientX, e.clientY);
    }
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchBase.current = null;
    setDragging(pointers.current.size === 1);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Palco — superfície de papel com hairline e sombra de tinta */}
      <div className="mx-auto w-full max-w-md">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">O palco · posicionamento</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Move className="size-3" />
            <span className="sm:hidden">toque e arraste · pince</span>
            <span className="hidden sm:inline">clique e arraste a arte</span>
          </span>
        </div>
        <div
          ref={containerRef}
          className={cn(
            "relative touch-none select-none overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-ink)]",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          <div className="relative overflow-hidden rounded-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bodyPhotoUrl} alt="Foto do corpo" className="w-full" draggable={false} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={designUrl}
              alt="Arte"
              draggable={false}
              className={cn(
                "pointer-events-none absolute mix-blend-multiply",
                dragging && "ring-2 ring-primary",
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
          Toque onde quer a tatuagem e arraste para ajustar. No celular, use dois dedos (pinça)
          para tamanho e giro.
        </p>
      </div>
    </div>
  );
}
