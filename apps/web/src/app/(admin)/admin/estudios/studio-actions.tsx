"use client";

import { useTransition } from "react";
import type { StudioStatus } from "@inkvision/core";
import { removeStudioAction, setStudioStatusAction } from "@/server/actions/studio";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function StudioActions({ studioId, status }: { studioId: string; status: StudioStatus }) {
  const [pending, startTransition] = useTransition();

  function change(next: StudioStatus) {
    startTransition(async () => {
      const res = await setStudioStatusAction(studioId, next);
      if (!res.ok) toast.error(res.error);
      else toast.success("Estúdio atualizado.");
    });
  }

  function remove() {
    if (!confirm("Remover este estúdio e todos os seus dados? Ação irreversível.")) return;
    startTransition(async () => {
      const res = await removeStudioAction(studioId);
      if (!res.ok) toast.error(res.error);
      else toast.success("Estúdio removido.");
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
    </div>
  );
}
