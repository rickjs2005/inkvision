"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import type { PortfolioItem, Style } from "@inkvision/core";
import { createPortfolioItemAction, deletePortfolioItemAction } from "@/server/actions/portfolio";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-border p-4">
        <div className="flex gap-2">
          {(["IMAGE", "BEFORE_AFTER"] as const).map((k) => (
            <Button
              key={k}
              type="button"
              size="sm"
              variant={kind === k ? "default" : "outline"}
              onClick={() => setKind(k)}
            >
              {k === "IMAGE" ? "Imagem" : "Antes & Depois"}
            </Button>
          ))}
        </div>

        {kind === "IMAGE" ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="media">Imagem</Label>
            <Input id="media" name="media" type="file" accept="image/*" required />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="before">Antes</Label>
              <Input id="before" name="before" type="file" accept="image/*" required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="after">Depois</Label>
              <Input id="after" name="after" type="file" accept="image/*" required />
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="styleId">Estilo</Label>
            <select
              id="styleId"
              name="styleId"
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
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
            <Label htmlFor="tags">Tags (vírgula)</Label>
            <Input id="tags" name="tags" placeholder="minimalista, braço" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? "Publicando…" : "Publicar no portfólio"}
          </Button>
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="group relative overflow-hidden rounded-lg border border-border">
            <Image
              src={it.type === "BEFORE_AFTER" ? it.afterUrl! : it.mediaUrl}
              alt={it.description ?? "Trabalho"}
              width={400}
              height={400}
              className="aspect-square w-full object-cover"
            />
            <button
              type="button"
              onClick={() => remove(it.id)}
              disabled={pending}
              className="absolute right-2 top-2 rounded-md bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Remover
            </button>
            {it.type === "BEFORE_AFTER" && (
              <span className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                Antes/Depois
              </span>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground">Nenhum trabalho publicado ainda.</p>
        )}
      </div>
    </div>
  );
}
