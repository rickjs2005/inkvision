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
 * Mostra o resultado da simulação. Quando o provider gerou variantes de
 * verdade (Fal, ou o próprio composto no mock), exibe a imagem real — nunca um
 * overlay de CSS fingindo ser o resultado da IA. O overlay só entra como
 * fallback defensivo se, por algum motivo, a simulação não tiver variantes
 * (não deveria acontecer numa simulação DONE).
 */
export function SimulationView({
  bodyPhotoUrl,
  designUrl,
  placement,
  variants,
}: {
  bodyPhotoUrl: string;
  designUrl: string;
  placement: SimulationPlacement;
  variants: { small: string; medium: string; large: string } | null;
}) {
  const [size, setSize] = useState<(typeof SIZES)[number]>(SIZES[1]);
  const realImage = variants?.[size.key] ?? null;
  // Hoje o provider gera uma única imagem e repete nas 3 chaves (P/M/G ainda
  // não variam de verdade) — mostrar o seletor como se ele fizesse algo seria
  // enganoso. Só aparece quando as variantes de fato diferem entre si, ou no
  // fallback de overlay (ali o `size.mult` realmente altera a escala exibida).
  const sizesActuallyDiffer = !variants || new Set(Object.values(variants)).size > 1;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {/* Moldura do resultado — papel com hairline e sombra */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">{realImage ? "O resultado · prévia com IA" : "Aproximação · sem IA"}</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-primary">
            <Sparkles className="size-3" />
            {realImage ? "simulação" : "estimativa"}
          </span>
        </div>
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-lift)]">
          <div className="relative overflow-hidden rounded-md">
            {realImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={realImage} alt="Simulação gerada por IA" className="w-full" />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Seletor de variante P/M/G — só quando muda algo de fato na imagem */}
      {sizesActuallyDiffer && (
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
      )}
    </div>
  );
}
