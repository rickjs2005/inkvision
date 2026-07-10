"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccountAction, exportMyDataAction } from "@/server/actions/account";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";

export function LgpdPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [pending, startTransition] = useTransition();

  async function exportData() {
    setBusy(true);
    const res = await exportMyDataAction();
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-dados-inkvision.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Seus dados foram baixados.");
  }

  function deleteAccount() {
    if (!confirm("Excluir sua conta? Seus dados pessoais serão anonimizados e você não poderá mais entrar. Isso é irreversível.")) return;
    startTransition(async () => {
      const res = await deleteMyAccountAction();
      if (!res.ok) return toast.error(res.error);
      await signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="font-medium">Exportar meus dados</p>
        <p className="text-sm text-muted-foreground">
          Baixe um arquivo com todos os seus dados na plataforma (perfil, pedidos, mensagens, avaliações).
        </p>
        <div>
          <Button variant="outline" onClick={exportData} disabled={busy}>
            {busy ? "Preparando…" : "Baixar meus dados (JSON)"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-6">
        <p className="font-medium text-destructive">Excluir minha conta</p>
        <p className="text-sm text-muted-foreground">
          Seus dados pessoais são anonimizados (LGPD). Pedidos e avaliações são mantidos sem
          identificação para integridade dos estúdios.
        </p>
        <div>
          <Button variant="destructive" onClick={deleteAccount} disabled={pending}>
            {pending ? "Excluindo…" : "Excluir conta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
