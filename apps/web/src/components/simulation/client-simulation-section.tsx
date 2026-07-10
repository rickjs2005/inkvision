"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import type { OrderStatus, SimulationPlacement } from "@inkvision/core";
import { RT } from "@inkvision/shared";
import {
  approveSimulationAction,
  requestSimulationAction,
  reviewDesignAction,
} from "@/server/actions/simulation";
import { Camera, Check, ImageUp, Loader2, Sparkles } from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { composeTattooImage, composeTattooMask } from "@/lib/compose-tattoo";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimulationEditor } from "./simulation-editor";
import { SimulationView } from "./simulation-view";

const SIM_STEPS = ["Arte", "Foto", "Posição", "Prévia"] as const;

/**
 * Barra de etapas da simulação — o fluxo tem 4 passos espalhados por vários
 * status do pedido; sem isto cada tela aparecia solta e o cliente não sabia
 * onde estava nem quanto faltava.
 */
function SimSteps({ current }: { current: number }) {
  return (
    <ol aria-label="Etapas da simulação" className="flex flex-wrap items-center gap-y-2">
      {SIM_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn("mx-2 h-px w-4 sm:w-6", done || active ? "bg-primary/50" : "bg-border")}
              />
            )}
            <span
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider",
                active ? "text-primary" : done ? "text-foreground/70" : "text-muted-foreground/60",
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border text-[10px]",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : done
                      ? "border-primary/50 text-primary"
                      : "border-border",
                )}
              >
                {done ? <Check className="size-3" strokeWidth={3} /> : n}
              </span>
              {/* No mobile, só a etapa atual mostra o rótulo — cabe na linha. */}
              <span className={cn(!active && "hidden sm:inline")}>{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const REALTIME_URL = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:4000";
const CENTER: SimulationPlacement = { x: 0.5, y: 0.5, scale: 1, rotation: 0 };

interface DesignInfo {
  imageUrl: string;
  feedback: string | null;
}
interface SimInfo {
  bodyPhotoUrl: string;
  designUrl: string;
  placement: SimulationPlacement;
  status: string;
  errorMessage: string | null;
  variants: { small: string; medium: string; large: string } | null;
}

export function ClientSimulationSection({
  orderId,
  studioId,
  status,
  roomToken,
  design,
  simulation,
}: {
  orderId: string;
  studioId: string;
  status: OrderStatus;
  roomToken: string;
  design: DesignInfo | null;
  simulation: SimInfo | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [redo, setRedo] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [bodyPhotoUrl, setBodyPhotoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<SimulationPlacement>(CENTER);

  const designUrl = simulation?.designUrl ?? design?.imageUrl ?? "";

  // Watcher realtime enquanto a IA processa + polling de fallback (ambientes
  // sem o serviço de realtime no ar, como o deploy de teste na Vercel).
  // router.refresh() re-executa toda a árvore RSC do pedido — por isso o poll
  // só corre solto quando o socket NÃO está conectado; conectado, vira apenas
  // uma rede de segurança esparsa contra evento perdido.
  useEffect(() => {
    if (status !== "SIMULATING") return;
    const socket = io(REALTIME_URL, { auth: { token: roomToken }, transports: ["websocket"] });
    socket.on(RT.SIMULATION_DONE, () => router.refresh());
    socket.on(RT.SIMULATION_FAILED, () => router.refresh());
    let ticks = 0;
    const poll = setInterval(() => {
      ticks += 1;
      if (!socket.connected || ticks % 4 === 0) router.refresh();
    }, 8000);
    return () => {
      socket.disconnect();
      clearInterval(poll);
    };
  }, [status, roomToken, router]);

  function reviewDesign(approve: boolean, fb?: string) {
    setError(null);
    startTransition(async () => {
      const res = await reviewDesignAction(orderId, {
        approve,
        feedback: approve ? undefined : fb,
      });
      if (res.ok) {
        setAdjusting(false);
        setFeedback("");
        router.refresh();
      } else setError(res.error);
    });
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const up = await uploadFile(file, "body-photo", studioId);
      setBodyPhotoUrl(up.publicUrl);
      setPlacement(CENTER);
    } catch {
      setError("Falha ao enviar a foto.");
    } finally {
      setBusy(false);
    }
  }

  function generate() {
    if (!bodyPhotoUrl) return;
    setError(null);
    setBusy(true);
    startTransition(async () => {
      try {
        // Compõe a arte real sobre a foto ANTES de enviar — sem isso, a IA só
        // recebe a foto crua e nunca vê o desenho de verdade (ver auditoria).
        // A máscara (mesma posição) restringe a IA a só repintar a área do
        // desenho — sem ela, um img2img puro pode reformular a foto inteira.
        const [imageBlob, maskBlob] = await Promise.all([
          composeTattooImage(bodyPhotoUrl, designUrl, placement),
          composeTattooMask(bodyPhotoUrl, designUrl, placement),
        ]);
        const imageFile = new File([imageBlob], "composicao.jpg", { type: "image/jpeg" });
        const maskFile = new File([maskBlob], "mascara.png", { type: "image/png" });
        const [composed, mask] = await Promise.all([
          uploadFile(imageFile, "body-photo", studioId),
          uploadFile(maskFile, "body-photo", studioId),
        ]);
        const res = await requestSimulationAction(orderId, {
          bodyPhotoUrl,
          placement,
          composedImageUrl: composed.publicUrl,
          composedMaskUrl: mask.publicUrl,
        });
        setBusy(false);
        if (res.ok) {
          setRedo(false);
          router.refresh();
        } else setError(res.error);
      } catch {
        setBusy(false);
        setError("Não foi possível preparar a imagem para a IA. Tente de novo.");
      }
    });
  }

  function approveSim() {
    startTransition(async () => {
      const res = await approveSimulationAction(orderId);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function startAdjust() {
    if (!simulation) return;
    setBodyPhotoUrl(simulation.bodyPhotoUrl);
    setPlacement(simulation.placement);
    setRedo(true);
  }

  // ── Aprovação da arte ──
  if (status === "DESIGN_REVIEW" && design) {
    return (
      <div className="flex flex-col gap-5">
        <SimSteps current={1} />
        <div>
          <span className="eyebrow">A arte proposta · aprove o traço</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            Aprove a arte
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Aprovando, o próximo passo é enviar uma foto para ver a arte na sua pele antes da
            agulha.
          </p>
        </div>
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-ink)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.imageUrl} alt="Arte proposta" className="w-full rounded-md" />
        </div>
        {adjusting ? (
          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <label htmlFor="design-feedback" className="eyebrow">
              O que ajustar na arte?
            </label>
            <textarea
              id="design-feedback"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Ex.: afinar o traço, diminuir o sombreado, trocar a flor…"
              autoFocus
              className="w-full resize-none rounded-md border border-input bg-background/40 px-3.5 py-2.5 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus:border-primary/60 focus:ring-4 focus:ring-primary/12"
            />
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => reviewDesign(false, feedback.trim())}
                disabled={pending || !feedback.trim()}
              >
                Enviar pedido de ajustes
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAdjusting(false);
                  setFeedback("");
                }}
                disabled={pending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button onClick={() => reviewDesign(true)} disabled={pending}>
              <Check /> Aprovar arte
            </Button>
            <Button variant="outline" onClick={() => setAdjusting(true)} disabled={pending}>
              Solicitar ajustes
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Foto + editor de posicionamento ──
  if (status === "DESIGN_APPROVED" || status === "AWAITING_BODY_PHOTO" || redo) {
    // A última tentativa falhou (provider de IA fora do ar, etc.) — o pedido
    // volta pra cá silenciosamente; sem isto o cliente não sabe por quê.
    const failedBanner = !redo && simulation?.status === "FAILED" && (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        A simulação anterior não foi gerada{simulation.errorMessage ? `: ${simulation.errorMessage}` : "."} Tente
        de novo.
      </p>
    );
    if (!bodyPhotoUrl) {
      return (
        <div className="flex flex-col gap-5">
          <SimSteps current={2} />
          <div>
            <span className="eyebrow">A tela do corpo</span>
            <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
              Envie uma foto do local
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Uma foto nítida da parte do corpo onde a tatuagem vai ficar — depois você posiciona a
              arte sobre ela.
            </p>
          </div>
          {failedBanner}
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
            <ImageUp className="size-7 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="text-sm text-muted-foreground">
              Toque para escolher uma imagem do aparelho.
            </span>
            <Input
              type="file"
              accept="image/*"
              onChange={uploadPhoto}
              disabled={busy}
              className="sr-only"
            />
            <span className="eyebrow text-primary">Escolher imagem</span>
          </label>
          {/* No celular, abre a CÂMERA direto; no desktop seria redundante. */}
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 text-sm transition-colors hover:border-foreground/30 hover:bg-foreground/[0.04] sm:hidden">
            <Camera className="size-4 text-primary" />
            Tirar foto agora
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={uploadPhoto}
              disabled={busy}
              className="sr-only"
            />
          </label>
          {busy && (
            <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Enviando foto…
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-5">
        <SimSteps current={3} />
        <div>
          <span className="eyebrow">O ateliê</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            Posicione a tatuagem
          </h3>
        </div>
        {failedBanner}
        <SimulationEditor
          bodyPhotoUrl={bodyPhotoUrl}
          designUrl={designUrl}
          value={placement}
          onChange={setPlacement}
        />
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button onClick={generate} disabled={busy || pending}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? "Gerando…" : "Gerar simulação"}
          </Button>
          <Button variant="outline" onClick={() => setBodyPhotoUrl(null)} disabled={busy}>
            Trocar foto
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Processando ──
  if (status === "SIMULATING") {
    return (
      <div className="flex flex-col gap-5">
        <SimSteps current={4} />
        <div>
          <span className="eyebrow">A tinta assenta</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            Gerando a simulação…
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Costuma levar menos de um minuto. Pode continuar navegando — a tela atualiza sozinha
            quando ficar pronta.
          </p>
        </div>
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-ink)]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-muted">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-muted to-muted/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          </div>
        </div>
        <p className="inline-flex items-center gap-2 border-t border-border pt-5 text-sm text-muted-foreground">
          <Sparkles className="size-4 text-primary" />
          Gerando a simulação com IA…
        </p>
      </div>
    );
  }

  // ── Revisão / aprovação ──
  if ((status === "SIMULATION_REVIEW" || status === "SIMULATION_APPROVED") && simulation) {
    return (
      <div className="flex flex-col gap-5">
        <SimSteps current={status === "SIMULATION_APPROVED" ? 5 : 4} />
        <div>
          <span className="eyebrow">A prévia</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            {status === "SIMULATION_APPROVED" ? "Simulação aprovada" : "Revise o resultado"}
          </h3>
          {status === "SIMULATION_REVIEW" && (
            <p className="mt-2 text-sm text-muted-foreground">
              É assim que a tatuagem fica na sua pele. Aprove para liberar o agendamento, ou volte
              e ajuste a posição.
            </p>
          )}
        </div>
        <SimulationView
          bodyPhotoUrl={simulation.bodyPhotoUrl}
          designUrl={simulation.designUrl}
          placement={simulation.placement}
          variants={simulation.variants}
        />
        {status === "SIMULATION_REVIEW" && (
          <div className="flex flex-wrap gap-3 border-t border-border pt-5">
            <Button onClick={approveSim} disabled={pending}>
              <Check /> Aprovar simulação
            </Button>
            <Button variant="outline" onClick={startAdjust} disabled={pending}>
              Ajustar posição
            </Button>
          </div>
        )}
        {status === "SIMULATION_APPROVED" && (
          <p className="inline-flex items-center gap-2 border-t border-border pt-5 text-sm text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            Simulação aprovada — próximo passo: agendar a sessão.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return null;
}
