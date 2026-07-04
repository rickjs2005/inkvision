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
      <div className="flex flex-col gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={design.imageUrl} alt="Arte proposta" className="mx-auto max-w-sm rounded-xl border border-border" />
        <div className="flex gap-3">
          <Button onClick={() => reviewDesign(true)} disabled={pending}>Aprovar arte</Button>
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
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Envie uma foto da parte do corpo para posicionar a tatuagem e ver o resultado com IA.
          </p>
          <Input type="file" accept="image/*" onChange={uploadPhoto} disabled={busy} />
          {busy && <p className="text-sm text-muted-foreground">Enviando foto…</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <SimulationEditor
          bodyPhotoUrl={bodyPhotoUrl}
          designUrl={designUrl}
          value={placement}
          onChange={setPlacement}
        />
        <div className="flex gap-3">
          <Button onClick={generate} disabled={busy || pending}>
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
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        Gerando a simulação com IA…
      </div>
    );
  }

  // ── Revisão / aprovação ──
  if ((status === "SIMULATION_REVIEW" || status === "SIMULATION_APPROVED") && simulation) {
    return (
      <div className="flex flex-col gap-4">
        <SimulationView
          bodyPhotoUrl={simulation.bodyPhotoUrl}
          designUrl={simulation.designUrl}
          placement={simulation.placement}
        />
        {status === "SIMULATION_REVIEW" && (
          <div className="flex gap-3">
            <Button onClick={approveSim} disabled={pending}>Aprovar simulação</Button>
            <Button variant="outline" onClick={startAdjust} disabled={pending}>
              Ajustar posição
            </Button>
          </div>
        )}
        {status === "SIMULATION_APPROVED" && (
          <p className="text-sm text-emerald-500">Simulação aprovada — próximo passo: agendar a sessão.</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return null;
}
