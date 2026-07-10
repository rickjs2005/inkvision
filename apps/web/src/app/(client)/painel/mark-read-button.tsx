"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction } from "@/server/actions/notification";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function MarkReadButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await markNotificationsReadAction();
          if (res.ok) router.refresh();
          else toast.error("Não foi possível marcar as notificações. Tente de novo.");
        })
      }
    >
      Marcar todas como lidas
    </Button>
  );
}
