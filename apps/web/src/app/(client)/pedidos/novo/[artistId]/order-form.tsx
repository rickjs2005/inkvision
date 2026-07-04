"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Clock, FileText, ImagePlus, MapPin, Palette, Ruler, X } from "lucide-react";
import type { Style } from "@inkvision/core";
import { createOrderAction } from "@/server/actions/order";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { FloatingInput, FloatingTextarea } from "@/components/ui/field";

/* Cabeçalho de seção — eyebrow numerada + régua de ateliê, com slot à direita. */
function SectionHeader({ n, title, aside }: { n: string; title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="eyebrow">
        {n} · {title}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
      {aside}
    </div>
  );
}

/* Miniatura de referência — thumbnail para imagens, ícone para PDFs. Só preview:
   o envio lê os arquivos direto do <input>, este estado é puramente visual. */
function ReferenceThumb({ file, index }: { file: File; index: number }) {
  const url = useMemo(() => (file.type.startsWith("image/") ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  return (
    <li className="group flex items-center gap-3 bg-card px-3 py-2.5">
      <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded border border-border bg-muted/50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-cover" />
        ) : (
          <FileText className="size-4 text-muted-foreground" />
        )}
      </span>
      <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
      <span className="font-mono text-[11px] text-muted-foreground/70">{(file.size / 1024).toFixed(0)} KB</span>
      <X className="size-3.5 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" aria-hidden />
    </li>
  );
}

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
  const [picked, setPicked] = useState<File[]>([]);

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
      {/* ── 01 · O desenho ── */}
      <section className="grid gap-6">
        <SectionHeader n="01" title="O desenho" />

        {/* Estilo — <select> nativo estilizado à altura dos campos premium */}
        <div className="flex flex-col gap-2">
          <label htmlFor="styleId" className="eyebrow">Estilo</label>
          <div className="group relative">
            <Palette className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70 transition-colors group-focus-within:text-primary" />
            <select
              id="styleId"
              name="styleId"
              defaultValue=""
              className="h-14 w-full appearance-none rounded-md border border-input bg-background/40 pl-10 pr-10 text-sm outline-none transition-[border-color,box-shadow,background-color] hover:border-foreground/25 focus:border-primary/60 focus:bg-background focus:ring-4 focus:ring-primary/12"
            >
              <option value="">A definir com o artista</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70 transition-transform group-focus-within:text-primary" />
          </div>
        </div>

        {/* Parte do corpo + tamanho — dupla assimétrica */}
        <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
          <FloatingInput
            id="bodyPart"
            name="bodyPart"
            label="Parte do corpo"
            icon={MapPin}
            required
            validate={(v) => v.trim().length >= 2}
          />
          <FloatingInput
            id="approxSizeCm"
            name="approxSizeCm"
            label="Tamanho (cm)"
            icon={Ruler}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            validate={(v) => Number(v) > 0 && Number(v) <= 200}
            className="font-mono"
          />
        </div>
      </section>

      {/* ── 02 · A ideia ── */}
      <section className="grid gap-6">
        <SectionHeader n="02" title="A ideia" />
        <div className="flex flex-col gap-2">
          <FloatingTextarea
            id="briefing"
            name="briefing"
            label="Descreva o projeto — elementos, posição, referências de estilo…"
            rows={5}
            required
            minLength={10}
          />
          <p className="text-xs text-muted-foreground">
            Quanto mais detalhe, mais preciso o orçamento.
          </p>
        </div>
      </section>

      {/* ── 03 · Referências ── */}
      <section className="grid gap-6">
        <SectionHeader
          n="03"
          title="Referências"
          aside={
            <span className="font-mono text-xs text-muted-foreground">
              {String(picked.length).padStart(2, "0")} / 08
            </span>
          }
        />

        <label
          htmlFor="references"
          className="group relative flex cursor-pointer flex-col items-center justify-center gap-2.5 overflow-hidden rounded-lg border border-dashed border-border bg-background/40 px-6 py-11 text-center transition-[border-color,background-color] hover:border-primary/50 hover:bg-muted/40"
        >
          <span className="grid size-12 place-items-center rounded-full border border-border bg-card shadow-[var(--shadow-ink)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5 group-hover:border-primary/40">
            <ImagePlus className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
          </span>
          <span className="text-sm font-medium">
            Arraste ou selecione imagens
          </span>
          <span className="eyebrow">Imagens ou PDF · até 8 arquivos</span>
          <input
            id="references"
            name="references"
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="sr-only"
            onChange={(e) =>
              setPicked(
                Array.from(e.currentTarget.files ?? [])
                  .filter((f) => f.size > 0)
                  .slice(0, 8),
              )
            }
          />
        </label>

        {picked.length > 0 && (
          <ul className="grid gap-px overflow-hidden rounded-md border border-border">
            {picked.map((file, i) => (
              <ReferenceThumb key={`${file.name}-${i}`} file={file} index={i} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Régua + envio ── */}
      <div className="border-t border-border pt-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
          <Button type="submit" size="lg" disabled={busy} className="group/cta">
            {busy ? "Enviando…" : "Enviar pedido"}
            {!busy && <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />}
          </Button>
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <Clock className="size-3.5 text-primary" />
            Resposta em até 24h <span className="text-primary">·</span> orçamento sob medida no chat
          </span>
        </div>
        {error && (
          <p className="mt-4 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
