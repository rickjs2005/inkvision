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
import { Check, ImageUp, Loader2, Sparkles } from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SimulationEditor } from "./simulation-editor";
import { SimulationView } from "./simulation-view";

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
  const [bodyPhotoUrl, setBodyPhotoUrl] = useState<string | null>(null);
  const [placement, setPlacement] = useState<SimulationPlacement>(CENTER);

  const designUrl = simulation?.designUrl ?? design?.imageUrl ?? "";

  // Watcher realtime enquanto a IA processa.
  useEffect(() => {
    if (status !== "SIMULATING") return;
    const socket = io(REALTIME_URL, { auth: { token: roomToken }, transports: ["websocket"] });
    socket.on(RT.SIMULATION_DONE, () => router.refresh());
    socket.on(RT.SIMULATION_FAILED, () => router.refresh());
    return () => {
      socket.disconnect();
    };
  }, [status, roomToken, router]);

  function reviewDesign(approve: boolean) {
    setError(null);
    const feedback = approve ? undefined : prompt("O que ajustar na arte?") ?? "";
    if (!approve && !feedback) return;
    startTransition(async () => {
      const res = await reviewDesignAction(orderId, { approve, feedback });
      if (res.ok) router.refresh();
      else setError(res.error);
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
      const res = await requestSimulationAction(orderId, { bodyPhotoUrl, placement });
      setBusy(false);
      if (res.ok) {
        setRedo(false);
        router.refresh();
      } else setError(res.error);
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
        <div>
          <span className="eyebrow">A arte proposta</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            Aprove o traço
          </h3>
        </div>
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg border border-border bg-card p-1.5 shadow-[var(--shadow-ink)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.imageUrl} alt="Arte proposta" className="w-full rounded-md" />
        </div>
        <div className="flex flex-wrap gap-3 border-t border-border pt-5">
          <Button onClick={() => reviewDesign(true)} disabled={pending}>
            <Check /> Aprovar arte
          </Button>
          <Button variant="outline" onClick={() => reviewDesign(false)} disabled={pending}>
            Solicitar ajustes
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  // ── Foto + editor de posicionamento ──
  if (status === "DESIGN_APPROVED" || status === "AWAITING_BODY_PHOTO" || redo) {
    if (!bodyPhotoUrl) {
      return (
        <div className="flex flex-col gap-5">
          <div>
            <span className="eyebrow">Enviar foto</span>
            <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
              A tela do corpo
            </h3>
          </div>
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50">
            <ImageUp className="size-7 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="text-sm text-muted-foreground">
              Envie uma foto da parte do corpo para posicionar a tatuagem e ver o resultado com IA.
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
        <div>
          <span className="eyebrow">O ateliê · posicionar</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            Componha a tatuagem
          </h3>
        </div>
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
        <div>
          <span className="eyebrow">Processando</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            A tinta assenta
          </h3>
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
        <div>
          <span className="eyebrow">A prévia</span>
          <h3 className="mt-1 font-display text-2xl font-light leading-tight tracking-[-0.02em]">
            {status === "SIMULATION_APPROVED" ? "Simulação aprovada" : "Revise o resultado"}
          </h3>
        </div>
        <SimulationView
          bodyPhotoUrl={simulation.bodyPhotoUrl}
          designUrl={simulation.designUrl}
          placement={simulation.placement}
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
