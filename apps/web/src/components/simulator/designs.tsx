/**
 * Desenhos de exemplo do simulador público — fine line em SVG. Renderizados em
 * tinta escura e sobrepostos à pele com blend "multiply", parecem uma tatuagem.
 */
import type { ComponentType } from "react";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function Botanical() {
  return (
    <svg viewBox="0 0 100 130" {...stroke}>
      <path d="M50 124 C50 100 50 74 50 48 C50 34 50 22 50 10" />
      <path d="M50 100 C37 95 29 84 27 70 M50 100 C63 95 71 84 73 70" />
      <path d="M50 80 C40 76 34 67 33 56 M50 80 C60 76 66 67 67 56" />
      <path d="M50 60 C43 57 39 50 38 42 M50 60 C57 57 61 50 62 42" />
      <path d="M50 10 C43 14 40 22 46 28 C49 31 51 31 54 28 C60 22 57 14 50 10 Z M42 20 C34 17 28 19 28 19 M58 20 C66 17 72 19 72 19" />
      <circle cx="50" cy="116" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="39" cy="64" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="61" cy="64" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Serpent() {
  return (
    <svg viewBox="0 0 100 130" {...stroke}>
      <path d="M50 18 C34 26 34 44 50 52 C66 60 66 78 50 86 C36 93 36 108 50 116" />
      <path d="M50 18 C56 14 62 15 64 20 C66 25 62 29 57 28" />
      <path d="M52 24 C55 26 55 30 52 31" />
      <circle cx="60" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M50 116 C48 120 49 124 52 126" />
      <path d="M44 40 h12 M44 46 h12 M44 72 h12 M44 78 h12" strokeWidth={1.2} opacity={0.7} />
    </svg>
  );
}

function Moth() {
  return (
    <svg viewBox="0 0 100 130" {...stroke}>
      <path d="M50 40 L50 96" />
      <path d="M48 40 C42 30 44 24 50 22 C56 24 58 30 52 40" />
      <path d="M50 46 C28 30 12 40 14 58 C16 74 40 72 50 60" />
      <path d="M50 46 C72 30 88 40 86 58 C84 74 60 72 50 60" />
      <path d="M50 62 C34 58 24 66 26 78 C28 88 44 86 50 74" />
      <path d="M50 62 C66 58 76 66 74 78 C72 88 56 86 50 74" />
      <circle cx="30" cy="52" r="3" />
      <circle cx="70" cy="52" r="3" />
      <path d="M50 96 L50 108 M50 108 C46 112 42 112 40 110 M50 108 C54 112 58 112 60 110" />
    </svg>
  );
}

function SunMoon() {
  return (
    <svg viewBox="0 0 100 130" {...stroke}>
      <circle cx="50" cy="52" r="20" />
      <path d="M50 20 C58 30 58 74 50 84 C64 80 72 67 72 52 C72 37 64 24 50 20 Z" fill="currentColor" opacity={0.9} />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI) / 6;
        const x1 = 50 + Math.cos(a) * 26;
        const y1 = 52 + Math.sin(a) * 26;
        const x2 = 50 + Math.cos(a) * 32;
        const y2 = 52 + Math.sin(a) * 32;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.4} />;
      })}
      <path d="M50 96 L50 118" strokeWidth={1.2} />
      <circle cx="50" cy="118" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 100 130" {...stroke}>
      <path d="M50 12 L50 118" />
      <path d="M50 12 L42 26 M50 12 L58 26" />
      <path d="M50 100 L40 112 M50 100 L60 112 M50 90 L42 100 M50 90 L58 100" />
      <path d="M38 44 L62 56 M62 44 L38 56" strokeWidth={1.4} />
    </svg>
  );
}

export interface TattooDesign {
  id: string;
  name: string;
  tag: string;
  Svg: ComponentType;
}

export const DESIGNS: TattooDesign[] = [
  { id: "botanical", name: "Ramo", tag: "Fine line", Svg: Botanical },
  { id: "serpent", name: "Serpente", tag: "Blackwork", Svg: Serpent },
  { id: "moth", name: "Mariposa", tag: "Fine line", Svg: Moth },
  { id: "sunmoon", name: "Sol & Lua", tag: "Geométrico", Svg: SunMoon },
  { id: "arrow", name: "Flecha", tag: "Minimalista", Svg: Arrow },
];
