"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { Heart, Trash2 } from "lucide-react";
import type { PortfolioItem, Style } from "@inkvision/core";
import { createPortfolioItemAction, deletePortfolioItemAction } from "@/server/actions/portfolio";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Kind = "IMAGE" | "BEFORE_AFTER";

export function PortfolioManager({
  artistId,
  studioId,
  items,
  styles,
}: {
  artistId: string;
  studioId: string;
  items: PortfolioItem[];
  styles: Style[];
}) {
  const [kind, setKind] = useState<Kind>("IMAGE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const tags = String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const styleId = (form.get("styleId") as string) || null;
      const description = (form.get("description") as string) || null;

      let payload;
      if (kind === "BEFORE_AFTER") {
        const before = form.get("before") as File;
        const after = form.get("after") as File;
        if (!before?.size || !after?.size) throw new Error("Envie as duas imagens.");
        const [b, a] = await Promise.all([
          uploadFile(before, "portfolio", studioId),
          uploadFile(after, "portfolio", studioId),
        ]);
        payload = {
          type: "BEFORE_AFTER" as const,
          beforeUrl: b.publicUrl,
          afterUrl: a.publicUrl,
          tags,
          styleId,
          description,
        };
      } else {
        const file = form.get("media") as File;
        if (!file?.size) throw new Error("Envie uma imagem.");
        const up = await uploadFile(file, "portfolio", studioId);
        payload = { type: "IMAGE" as const, mediaUrl: up.publicUrl, tags, styleId, description };
      }

      const res = await createPortfolioItemAction(artistId, payload);
      if (!res.ok) throw new Error(res.error);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar.");
    } finally {
      setBusy(false);
    }
  }

  function remove(itemId: string) {
    if (!confirm("Remover este item do portfólio?")) return;
    startTransition(() => {
      void deletePortfolioItemAction(itemId, artistId);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-ink)]"
      >
        <div className="flex flex-col gap-2">
          <span className="eyebrow">Tipo de peça</span>
          <div className="inline-flex gap-2">
            {(["IMAGE", "BEFORE_AFTER"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setKind(k)}
                aria-pressed={kind === k}
                className={cn(
                  "rounded-sm border px-3.5 py-1.5 text-[13px] transition-colors",
                  kind === k
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {k === "IMAGE" ? "Imagem" : "Antes & Depois"}
              </button>
            ))}
          </div>
        </div>

        {kind === "IMAGE" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="media" className="eyebrow">
              Imagem
            </Label>
            <Input id="media" name="media" type="file" accept="image/*" required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="before" className="eyebrow">
                Antes
              </Label>
              <Input id="before" name="before" type="file" accept="image/*" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="after" className="eyebrow">
                Depois
              </Label>
              <Input id="after" name="after" type="file" accept="image/*" required />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="styleId" className="eyebrow">
              Estilo
            </Label>
            <select
              id="styleId"
              name="styleId"
              className="h-11 rounded-md border border-input bg-background/40 px-3 text-sm transition-colors focus-visible:border-primary/60 focus-visible:outline-none"
            >
              <option value="">—</option>
              {styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tags" className="eyebrow">
              Tags (vírgula)
            </Label>
            <Input id="tags" name="tags" placeholder="minimalista, braço" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="eyebrow">
            Descrição
          </Label>
          <Input id="description" name="description" />
        </div>

        <div className="flex items-center gap-4">
          <Button type="submit" disabled={busy}>
            {busy ? "Publicando…" : "Publicar no portfólio"}
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </form>

      <div>
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <span className="eyebrow">Publicados</span>
          <span className="font-mono text-xs text-muted-foreground">
            {String(items.length).padStart(2, "0")}{" "}
            {items.length === 1 ? "peça" : "peças"}
          </span>
        </div>

        {items.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">Nenhum trabalho publicado ainda.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((it) => (
              <div
                key={it.id}
                className="group relative overflow-hidden rounded-md border border-border"
              >
                <Image
                  src={it.type === "BEFORE_AFTER" ? it.afterUrl! : it.mediaUrl}
                  alt={it.description ?? "Trabalho"}
                  width={400}
                  height={400}
                  className="aspect-square w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                />
                {/* Véu de tinta no hover */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {it.type === "BEFORE_AFTER" && (
                  <span className="absolute left-2 top-2 rounded-[4px] bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-white">
                    Antes / Depois
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => remove(it.id)}
                  disabled={pending}
                  aria-label="Remover do portfólio"
                  className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-sm bg-primary px-2 py-1 text-xs text-primary-foreground opacity-0 shadow-[var(--shadow-ink)] transition-opacity group-hover:opacity-100 disabled:opacity-40"
                >
                  <Trash2 className="size-3.5" />
                  Remover
                </button>

                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 font-mono text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <Heart className="size-3.5 fill-primary text-primary" />
                  {String(it.likesCount).padStart(2, "0")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
