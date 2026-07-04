"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markNotificationsReadAction } from "@/server/actions/notification";
import { Button } from "@/components/ui/button";

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
          await markNotificationsReadAction();
          router.refresh();
        })
      }
    >
      Marcar todas como lidas
    </Button>
  );
}
