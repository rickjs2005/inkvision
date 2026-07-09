"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Camera, Download, ImageUp, Move, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthAwareCta } from "@/components/marketing/auth-aware-cta";
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

export function SimulatorStudio({ aiEnabled = false }: { aiEnabled?: boolean }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgWrapRef = useRef<HTMLDivElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [skin, setSkin] = useState(0);
  const [designId, setDesignId] = useState(DESIGNS[0]!.id);
  const [t, setT] = useState(DEFAULT_T);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  // Resultado da IA (data URI). Qualquer mudança na composição invalida.
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [showAi, setShowAi] = useState(true);

  const design = DESIGNS.find((d) => d.id === designId)!;
  const activeSkin = SKINS[skin]!;
  const aiVisible = aiImage !== null && showAi;

  function moveTo(clientX: number, clientY: number) {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAiImage(null);
    setT((prev) => ({
      ...prev,
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    }));
  }

  // ── Gestos no palco ──
  // 1 dedo/ponteiro: a arte vai para onde você toca e segue o arrasto (não
  // precisa acertar o desenho — essencial no celular). 2 dedos: pinça ajusta
  // tamanho e giro ao mesmo tempo.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchBase = useRef<{ dist: number; angle: number; scale: number; rotation: number } | null>(null);

  function pinchOf(): { dist: number; angle: number } {
    const [a, b] = [...pointers.current.values()];
    return {
      dist: Math.hypot(b!.x - a!.x, b!.y - a!.y),
      angle: (Math.atan2(b!.y - a!.y, b!.x - a!.x) * 180) / Math.PI,
    };
  }

  function onStagePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (aiVisible || aiBusy) return;
    // Alguns browsers lançam se o ponteiro já se foi — capturar é otimização
    // (não perder o arrasto na borda), nunca pode abortar o gesto.
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
      pinchBase.current = { dist, angle, scale: t.scale, rotation: t.rotation };
    }
  }

  function onStagePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size >= 2 && pinchBase.current) {
      const base = pinchBase.current;
      const { dist, angle } = pinchOf();
      setAiImage(null);
      setT((prev) => {
        // Normaliza para a faixa do slider (-180..180).
        let rotation = base.rotation + (angle - base.angle);
        rotation = ((rotation + 540) % 360) - 180;
        return {
          ...prev,
          scale: Math.min(2.5, Math.max(0.3, (base.scale * dist) / Math.max(base.dist, 1))),
          rotation,
        };
      });
    } else if (dragging) {
      moveTo(e.clientX, e.clientY);
    }
  }

  function onStagePointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchBase.current = null;
    // Sobrou um dedo? Continua arrastando com ele.
    setDragging(pointers.current.size === 1);
  }

  /** Muda a composição (pele/arte/ajustes) e descarta o resultado da IA. */
  function recompose(fn: () => void) {
    setAiImage(null);
    fn();
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!photoConsent) {
      e.target.value = "";
      return toast.error("Marque a caixa abaixo antes de enviar sua própria foto.");
    }
    if (!file.type.startsWith("image/")) return toast.error("Envie uma imagem (JPG ou PNG).");
    recompose(() => setPhoto(URL.createObjectURL(file)));
  }

  function reset() {
    recompose(() => {
      setPhoto(null);
      setT(DEFAULT_T);
    });
    toast.success("Recomeçado.");
  }

  /** Composição atual (foto/pele + arte posicionada) num canvas de 900px. */
  async function composeCanvas(): Promise<HTMLCanvasElement> {
    const stage = stageRef.current;
    const svgEl = svgWrapRef.current?.querySelector("svg");
    if (!stage || !svgEl) throw new Error("palco indisponível");

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
    // Dimensões numéricas explícitas: sem elas o SVG standalone não tem tamanho
    // intrínseco — o Chrome assume 300x150 (proporção errada) e o Safari se
    // recusa a desenhar no canvas (download quebrado no iOS).
    clone.setAttribute("width", "100");
    clone.setAttribute("height", "130");
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
    return canvas;
  }

  async function download() {
    // Com o resultado da IA em exibição, baixa ele; senão, a composição local.
    if (aiVisible && aiImage) {
      const a = document.createElement("a");
      a.href = aiImage;
      a.download = "simulacao-ia-inkvision.png";
      a.click();
      toast.success("Simulação com IA baixada.");
      return;
    }
    setBusy(true);
    try {
      const canvas = await composeCanvas();
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

  /** Manda a composição atual para a IA refinar (rota pública rate-limitada). */
  async function generateAi() {
    // Checa o consentimento NO MOMENTO do envio (não só no upload) — evita que
    // marcar, enviar a foto e depois desmarcar ainda mande a foto pra IA.
    if (photo && !photoConsent) {
      toast.error("Marque a caixa de consentimento antes de gerar com IA.");
      return;
    }
    setAiBusy(true);
    try {
      const canvas = await composeCanvas();
      const image = canvas.toDataURL("image/jpeg", 0.85);
      const res = await fetch("/api/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, usesRealPhoto: photo !== null, consent: photo ? photoConsent : true }),
      });
      const data = (await res.json().catch(() => null)) as { image?: string; error?: string } | null;
      if (!res.ok || !data?.image) {
        throw new Error(data?.error ?? "A IA não conseguiu gerar agora. Tente de novo.");
      }
      setAiImage(data.image);
      setShowAi(true);
      toast.success("Pronto — sua tatuagem aplicada pela IA.");
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "A IA não conseguiu gerar agora.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      {/* ── Palco ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">O palco · sua pele</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            <Move className="size-3" />
            <span className="sm:hidden">toque e arraste · pince p/ tamanho e giro</span>
            <span className="hidden sm:inline">clique e arraste a arte</span>
          </span>
        </div>
        <div
          ref={stageRef}
          className={cn(
            "relative mx-auto aspect-[3/4] w-full max-w-md touch-none select-none overflow-hidden rounded-xl border border-border shadow-[var(--shadow-lift)]",
            !aiVisible && (dragging ? "cursor-grabbing" : "cursor-grab"),
          )}
          onPointerDown={onStagePointerDown}
          onPointerMove={onStagePointerMove}
          onPointerUp={onStagePointerEnd}
          onPointerCancel={onStagePointerEnd}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Sua foto" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          ) : (
            <div className="absolute inset-0" style={{ background: activeSkin.css }} />
          )}
          {/* grão sutil */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.05] shadow-[inset_0_0_90px_20px_rgba(20,15,10,0.4)]" />

          {/* arte — escondida quando o resultado da IA está em exibição.
              pointer-events-none: os gestos vivem no palco inteiro. */}
          <div
            ref={svgWrapRef}
            className={cn(
              // aspect fixo = altura definida p/ o SVG de 100% (Safari/iOS
              // colapsa sem isso); proporção espelha o viewBox 100x130.
              "pointer-events-none absolute aspect-[10/13] mix-blend-multiply",
              aiVisible && "invisible",
            )}
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

          {/* resultado da IA por cima da composição */}
          {aiVisible && aiImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={aiImage} alt="Simulação gerada por IA" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
          )}

          {/* gerando: véu com pulso */}
          {aiBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
              <Sparkles className="size-6 animate-pulse text-primary" />
              <p className="px-6 text-center text-sm text-foreground">
                A IA está aplicando sua tatuagem…
                <span className="block font-mono text-[11px] text-muted-foreground">leva alguns segundos</span>
              </p>
            </div>
          )}

          {/* antes / depois */}
          {aiImage && !aiBusy && (
            <div className="absolute right-2 top-2 flex overflow-hidden rounded-md border border-border bg-background/85 font-mono text-[11px] uppercase tracking-wider backdrop-blur-sm">
              {([["antes", false], ["depois · ia", true]] as const).map(([label, v]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setShowAi(v)}
                  className={cn("px-2.5 py-1.5 transition-colors", showAi === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Consentimento — só se aplica a foto real; peles sintéticas não precisam */}
        <label className="mx-auto mt-4 flex w-full max-w-md items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <input
            type="checkbox"
            checked={photoConsent}
            onChange={(e) => setPhotoConsent(e.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-[var(--primary)]"
          />
          <span>
            Para enviar minha própria foto, entendo que ela será processada por um provedor de IA de
            terceiro só para gerar esta prévia (
            <Link href="/privacidade" target="_blank" className="ink-link">
              saiba mais
            </Link>
            ).
          </span>
        </label>

        {/* fonte da imagem */}
        <div className="mx-auto mt-3 flex w-full max-w-md flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/[0.04]">
            <ImageUp className="size-4 text-primary" />
            Enviar minha foto
            <input type="file" accept="image/*" className="sr-only" onChange={onUpload} />
          </label>
          {/* No celular, abre a CÂMERA direto (capture); no desktop seria
              redundante com o seletor de arquivo, então fica escondido. */}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/[0.04] sm:hidden">
            <Camera className="size-4 text-primary" />
            Tirar foto
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={onUpload} />
          </label>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">ou pele</span>
          {SKINS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                recompose(() => {
                  setPhoto(null);
                  setSkin(i);
                })
              }
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
                onClick={() => recompose(() => setDesignId(d.id))}
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
          <Slider label="Tamanho" value={`${t.scale.toFixed(2)}×`} min={0.3} max={2.5} step={0.05} v={t.scale} on={(v) => recompose(() => setT((p) => ({ ...p, scale: v })))} />
          <Slider label="Rotação" value={`${t.rotation > 0 ? "+" : ""}${Math.round(t.rotation)}°`} min={-180} max={180} step={1} v={t.rotation} on={(v) => recompose(() => setT((p) => ({ ...p, rotation: v })))} icon={<RotateCw className="size-3" />} />
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-6">
          {aiEnabled && (
            <Button onClick={generateAi} disabled={aiBusy || busy} className="group/ai w-full">
              <Sparkles className="transition-transform group-hover/ai:rotate-12" />
              {aiBusy ? "Gerando com IA…" : aiImage ? "Gerar de novo com IA" : "Ver com IA real"}
            </Button>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={download} variant="ink" disabled={busy || aiBusy}>
              <Download /> {busy ? "Gerando…" : aiVisible ? "Baixar resultado da IA" : "Baixar prévia"}
            </Button>
            <Button onClick={reset} variant="ghost">
              Recomeçar
            </Button>
          </div>
          {aiEnabled && (
            <p className="font-mono text-[11px] leading-relaxed text-muted-foreground">
              Ao gerar com IA, a imagem composta é enviada para processamento. A prévia interativa
              continua 100% no seu navegador.
            </p>
          )}
        </div>

        {/* CTA — fazer de verdade */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="font-display text-xl leading-tight">Gostou do resultado?</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Isto é uma prévia. Com um artista da InkVision, a IA aplica o desenho com perspectiva, luz
            e sombra reais — e você agenda a sessão.
          </p>
          <AuthAwareCta
            size="lg"
            className="group/cta mt-4 w-full"
            anonHref="/cadastro"
            authedHref="/tatuadores"
          >
            <Sparkles className="transition-transform group-hover/cta:rotate-12" />
            Fazer com um artista
            <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
          </AuthAwareCta>
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
