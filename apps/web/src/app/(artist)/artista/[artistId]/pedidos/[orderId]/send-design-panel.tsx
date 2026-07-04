"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendDesignAction } from "@/server/actions/simulation";
import { uploadFile } from "@/lib/upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input name="design" type="file" accept="image/*" required />
      <Input name="notes" placeholder="Observações (opcional)" />
      <div>
        <Button type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar arte para aprovação"}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
