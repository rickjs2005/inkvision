"use client";

import { useState, useTransition } from "react";
import type { StudioStatus } from "@inkvision/core";
import { removeStudioAction, setStudioStatusAction } from "@/server/actions/studio";
import { Button } from "@/components/ui/button";

export function StudioActions({ studioId, status }: { studioId: string; status: StudioStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function change(next: StudioStatus) {
    setError(null);
    startTransition(async () => {
      const res = await setStudioStatusAction(studioId, next);
      if (!res.ok) setError(res.error);
    });
  }

  function remove() {
    if (!confirm("Remover este estúdio e todos os seus dados? Ação irreversível.")) return;
    setError(null);
    startTransition(async () => {
      const res = await removeStudioAction(studioId);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {status === "SUSPENDED" ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => change("ACTIVE")}>
          Reativar
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => change("SUSPENDED")}>
          Suspender
        </Button>
      )}
      <Button size="sm" variant="destructive" disabled={pending} onClick={remove}>
        Remover
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
