"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { sendDesignAction } from "@/server/actions/simulation";
import { uploadFile } from "@/lib/upload";
import { FloatingTextarea } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SendDesignPanel({
  studioId,
  orderId,
  artistId,
}: {
  studioId: string;
  orderId: string;
  artistId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setFileName(file?.name ?? null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      const file = form.get("design") as File;
      if (!file?.size) throw new Error("Envie a arte.");
      const up = await uploadFile(file, "design", studioId);
      const res = await sendDesignAction(studioId, orderId, artistId, {
        imageUrl: up.publicUrl,
        notes: (form.get("notes") as string) || null,
      });
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="design" className="eyebrow">
          Arquivo da arte
        </Label>
        <label
          htmlFor="design"
          className="group flex cursor-pointer items-center gap-4 rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 transition-colors hover:border-primary/50 hover:bg-muted/60"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Prévia da arte"
              className="size-14 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="flex size-14 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
              <UploadCloud className="size-5" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm text-foreground">
              {fileName ?? "Selecionar imagem"}
            </span>
            <span className="mt-0.5 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {fileName ? "Trocar arquivo" : "PNG · JPG"}
            </span>
          </span>
        </label>
        <Input
          id="design"
          name="design"
          type="file"
          accept="image/*"
          required
          onChange={onPick}
          className="sr-only"
        />
      </div>

      <FloatingTextarea
        id="notes"
        name="notes"
        label="Observações para o cliente (opcional)"
        rows={3}
      />

      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar arte para aprovação"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
