"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Style } from "@inkvision/core";
import { createOrderAction } from "@/server/actions/order";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OrderForm({
  artistId,
  studioId,
  styles,
}: {
  artistId: string;
  studioId: string;
  styles: Style[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const files = form.getAll("references").filter((f): f is File => f instanceof File && f.size > 0);
      const references = await Promise.all(
        files.slice(0, 8).map(async (f) => ({ fileUrl: (await uploadFile(f, "reference", studioId)).publicUrl })),
      );

      const res = await createOrderAction({
        artistId,
        styleId: (form.get("styleId") as string) || null,
        bodyPart: String(form.get("bodyPart") ?? ""),
        approxSizeCm: form.get("approxSizeCm") ? Number(form.get("approxSizeCm")) : null,
        briefing: String(form.get("briefing") ?? ""),
        references,
      });
      if (!res.ok) throw new Error(res.error);
      router.push(`/pedidos/${res.data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar o pedido.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="styleId">Estilo</Label>
          <select id="styleId" name="styleId" className="h-10 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="">—</option>
            {styles.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bodyPart">Parte do corpo</Label>
          <Input id="bodyPart" name="bodyPart" required placeholder="Antebraço direito" />
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:max-w-[200px]">
        <Label htmlFor="approxSizeCm">Tamanho aproximado (cm)</Label>
        <Input id="approxSizeCm" name="approxSizeCm" type="number" min={1} max={200} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="briefing">Descreva sua ideia</Label>
        <textarea
          id="briefing"
          name="briefing"
          rows={5}
          required
          minLength={10}
          placeholder="Conte o que você imagina: elementos, posição, referências de estilo…"
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="references">Referências (imagens ou PDF, até 8)</Label>
        <Input id="references" name="references" type="file" accept="image/*,application/pdf" multiple />
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar pedido"}
        </Button>
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
    </form>
  );
}
