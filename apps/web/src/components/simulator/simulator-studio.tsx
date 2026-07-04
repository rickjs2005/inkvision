"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Download, ImageUp, Move, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { DESIGNS } from "./designs";

const INK = "#17120e";

type Skin = { id: string; label: string; css: string; stops: [string, string, string] };
const SKINS: Skin[] = [
  { id: "clara", label: "Clara", css: "linear-gradient(150deg,#f1ddc3,#ddbd97,#c9a079)", stops: ["#f1ddc3", "#ddbd97", "#c9a079"] },
  { id: "media", label: "Média", css: "linear-gradient(150deg,#d3a877,#bd8a5b,#9c6f45)", stops: ["#d3a877", "#bd8a5b", "#9c6f45"] },
  { id: "escura", label: "Escura", css: "linear-gradient(150deg,#7c563a,#5e4030,#472f22)", stops: ["#7c563a", "#5e4030", "#472f22"] },
];

const DEFAULT_T = { x: 0.5, y: 0.46, scale: 1, rotation: 0 };
const BASE_WIDTH = 30; // % da largura do palco

export function SimulatorStudio() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [skin, setSkin] = useState(0);
  const [designId, setDesignId] = useState(DESIGNS[0]!.id);
  const [t, setT] = useState(DEFAULT_T);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const design = DESIGNS.find((d) => d.id === designId)!;
  const activeSkin = SKINS[skin]!;

  function moveTo(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setT((prev) => ({
      ...prev,
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    }));
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem (JPG ou PNG).");
    setPhoto(URL.createObjectURL(file));
  }

  function reset() {
    setPhoto(null);
    setT(DEFAULT_T);
    toast.success("Recomeçado.");
  }

  async function download() {
    const stage = stageRef.current;
    const svgEl = svgWrapRef.current?.querySelector("svg");
    if (!stage || !svgEl) return;
    setBusy(true);
    try {
      const W = 900;
      const H = Math.round((W * stage.offsetHeight) / stage.offsetWidth);
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // fundo: foto ou pele sintética
      if (photo) {
        const img = await loadImage(photo);
        drawCover(ctx, img, W, H);
      } else {
        const g = ctx.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, activeSkin.stops[0]);
        g.addColorStop(0.55, activeSkin.stops[1]);
        g.addColorStop(1, activeSkin.stops[2]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }

      // arte (blend multiply)
      const clone = svgEl.cloneNode(true) as SVGSVGElement;
      clone.setAttribute("color", INK);
      const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(new XMLSerializer().serializeToString(clone))));
      const art = await loadImage(dataUrl);
      const dW = (BASE_WIDTH / 100) * W * t.scale;
      const dH = (dW * art.height) / art.width;
      ctx.globalCompositeOperation = "multiply";
      ctx.save();
      ctx.translate(t.x * W, t.y * H);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.drawImage(art, -dW / 2, -dH / 2, dW, dH);
      ctx.restore();

      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "simulacao-inkvision.png";
      a.click();
      toast.success("Prévia baixada.");
    } catch {
      toast.error("Não foi possível baixar. Tente outra foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      {/* ── Palco ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">O palco · sua pele</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Move className="size-3" /> arraste a arte
          </span>
        </div>
        <div
          ref={stageRef}
          className="relative mx-auto aspect-[3/4] w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-border shadow-[var(--shadow-lift)]"
          onPointerMove={(e) => dragging && moveTo(e.clientX, e.clientY)}
          onPointerUp={() => setDragging(false)}
          onPointerLeave={() => setDragging(false)}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Sua foto" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="absolute inset-0" style={{ background: activeSkin.css }} />
          )}
          {/* grão sutil */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] shadow-[inset_0_0_90px_20px_rgba(20,15,10,0.4)]" />

          {/* arte */}
          <div
            ref={svgWrapRef}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setDragging(true);
            }}
            className={cn("absolute mix-blend-multiply", dragging ? "cursor-grabbing" : "cursor-grab")}
            style={{
              left: `${t.x * 100}%`,
              top: `${t.y * 100}%`,
              width: `${BASE_WIDTH * t.scale}%`,
              color: INK,
              transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
            }}
          >
            <design.Svg />
            {dragging && <span className="pointer-events-none absolute -inset-3 rounded-md ring-2 ring-primary/70" />}
          </div>
        </div>

        {/* fonte da imagem */}
        <div className="mx-auto mt-4 flex w-full max-w-md flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/[0.04]">
            <ImageUp className="size-4 text-primary" />
            Enviar minha foto
            <input type="file" accept="image/*" className="sr-only" onChange={onUpload} />
          </label>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">ou pele</span>
          {SKINS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setPhoto(null);
                setSkin(i);
              }}
              aria-label={`Pele ${s.label}`}
              className={cn(
                "size-8 rounded-full border-2 transition-transform hover:scale-110",
                !photo && skin === i ? "border-primary" : "border-border",
              )}
              style={{ background: s.css }}
            />
          ))}
        </div>
      </div>

      {/* ── Controles ── */}
      <div className="flex flex-col gap-7">
        <div>
          <span className="eyebrow">Escolha a arte</span>
          <div className="mt-3 grid grid-cols-5 gap-2">
            {DESIGNS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDesignId(d.id)}
                aria-label={d.name}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md border p-2 text-foreground transition-all hover:-translate-y-0.5",
                  designId === d.id ? "border-primary bg-primary/5 shadow-[var(--shadow-ink)]" : "border-border hover:border-foreground/30",
                )}
              >
                <d.Svg />
              </button>
            ))}
          </div>
          <p className="mt-2 font-display text-lg leading-none">
            {design.name} <span className="font-sans text-xs text-muted-foreground">· {design.tag}</span>
          </p>
        </div>

        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <Slider label="Tamanho" value={`${t.scale.toFixed(2)}×`} min={0.3} max={2.5} step={0.05} v={t.scale} on={(v) => setT((p) => ({ ...p, scale: v }))} />
          <Slider label="Rotação" value={`${t.rotation > 0 ? "+" : ""}${Math.round(t.rotation)}°`} min={-180} max={180} step={1} v={t.rotation} on={(v) => setT((p) => ({ ...p, rotation: v }))} icon={<RotateCw className="size-3" />} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-6">
          <Button onClick={download} variant="ink" disabled={busy}>
            <Download /> {busy ? "Gerando…" : "Baixar prévia"}
          </Button>
          <Button onClick={reset} variant="ghost">
            Recomeçar
          </Button>
        </div>

        {/* CTA — fazer de verdade */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-display text-xl leading-tight">Gostou do resultado?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Isto é uma prévia. Com um artista da InkVision, a IA aplica o desenho com perspectiva, luz
            e sombra reais — e você agenda a sessão.
          </p>
          <Button asChild size="lg" className="group/cta mt-4 w-full">
            <Link href="/cadastro">
              <Sparkles className="transition-transform group-hover/cta:rotate-12" />
              Fazer com um artista
              <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
            </Link>
          </Button>
          <p className="mt-2 text-center font-mono text-xs text-muted-foreground">
            Grátis <span className="text-primary">·</span> sem cartão
          </p>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  v,
  on,
  icon,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  v: number;
  on: (v: number) => void;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="flex items-center justify-between">
        <span className="eyebrow inline-flex items-center gap-1.5">
          {icon}
          {label}
        </span>
        <span className="font-mono text-xs text-foreground">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => on(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-[var(--primary)]"
      />
    </label>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) {
  const r = Math.max(W / img.width, H / img.height);
  const w = img.width * r;
  const h = img.height * r;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
}
