"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
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
  const [pickedNames, setPickedNames] = useState<string[]>([]);

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
    <form onSubmit={onSubmit} className="grid gap-12">
      {/* Seção · O desenho */}
      <section className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="eyebrow">01 · O desenho</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="styleId" className="eyebrow">Estilo</Label>
            <select
              id="styleId"
              name="styleId"
              defaultValue=""
              className="flex h-11 w-full rounded-md border border-input bg-background/40 px-3.5 text-sm transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
            >
              <option value="">A definir</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="bodyPart" className="eyebrow">Parte do corpo</Label>
            <Input id="bodyPart" name="bodyPart" required placeholder="Antebraço direito" />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:max-w-[220px]">
          <Label htmlFor="approxSizeCm" className="eyebrow">Tamanho aproximado</Label>
          <div className="relative">
            <Input
              id="approxSizeCm"
              name="approxSizeCm"
              type="number"
              min={1}
              max={200}
              placeholder="12"
              className="pr-12 font-mono"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
              cm
            </span>
          </div>
        </div>
      </section>

      {/* Seção · A ideia */}
      <section className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="eyebrow">02 · A ideia</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="briefing" className="eyebrow">Descreva o projeto</Label>
          <textarea
            id="briefing"
            name="briefing"
            rows={5}
            required
            minLength={10}
            placeholder="Conte o que você imagina: elementos, posição, referências de estilo…"
            className="flex w-full rounded-md border border-input bg-background/40 px-3.5 py-2.5 text-sm leading-relaxed transition-[border-color,box-shadow,background-color] placeholder:text-muted-foreground/70 hover:border-foreground/25 focus-visible:border-primary/60 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/12"
          />
          <p className="text-xs text-muted-foreground">
            Quanto mais detalhe, mais preciso o orçamento.
          </p>
        </div>
      </section>

      {/* Seção · Referências */}
      <section className="grid gap-5">
        <div className="flex items-center gap-3">
          <span className="eyebrow">03 · Referências</span>
          <span className="h-px flex-1 bg-border" />
          <span className="font-mono text-xs text-muted-foreground">
            {String(pickedNames.length).padStart(2, "0")} / 08
          </span>
        </div>

        <label
          htmlFor="references"
          className="group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background/40 px-6 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
        >
          <ImagePlus className="size-6 text-muted-foreground transition-colors group-hover:text-primary" />
          <span className="text-sm font-medium">
            Arraste ou selecione imagens
          </span>
          <span className="eyebrow">Imagens ou PDF · até 8 arquivos</span>
          <Input
            id="references"
            name="references"
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(e) =>
              setPickedNames(
                Array.from(e.currentTarget.files ?? [])
                  .filter((f) => f.size > 0)
                  .slice(0, 8)
                  .map((f) => f.name),
              )
            }
          />
        </label>

        {pickedNames.length > 0 && (
          <ul className="grid gap-px overflow-hidden rounded-md border border-border">
            {pickedNames.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex items-center gap-3 bg-card px-3.5 py-2.5"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{name}</span>
                <X className="size-3.5 shrink-0 text-muted-foreground/50" aria-hidden />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Régua + envio */}
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-8">
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar pedido"}
        </Button>
        <span className="text-xs text-muted-foreground">
          O tatuador responde com o orçamento no chat.
        </span>
        {error && (
          <span className="w-full text-sm text-destructive" role="alert">
            {error}
          </span>
        )}
      </div>
    </form>
  );
}
