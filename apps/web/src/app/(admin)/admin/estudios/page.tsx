import type { StudioStatus } from "@inkvision/core";
import { listStudios } from "@/server/actions/studio";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateStudioForm } from "./create-studio-form";
import { StudioActions } from "./studio-actions";

const STATUS_LABEL: Record<StudioStatus, { text: string; variant: "success" | "warning" | "destructive" }> = {
  ACTIVE: { text: "Ativo", variant: "success" },
  PENDING: { text: "Onboarding", variant: "warning" },
  SUSPENDED: { text: "Suspenso", variant: "destructive" },
};

export default async function AdminStudiosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const status = (["ACTIVE", "PENDING", "SUSPENDED"] as const).includes(sp.status as StudioStatus)
    ? (sp.status as StudioStatus)
    : undefined;

  const { items, total } = await listStudios({ status, query: sp.q });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">Administração · Estúdios</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl">Estúdios</h1>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {String(total).padStart(2, "0")} {total === 1 ? "estúdio" : "estúdios"} na plataforma
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-6">
          <p className="eyebrow">Cadastro</p>
          <h2 className="mt-1.5 font-display text-lg leading-tight">Cadastrar estúdio</h2>
        </div>
        <div className="p-6">
          <CreateStudioForm />
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="eyebrow px-6 py-4 text-left">Estúdio</th>
                <th className="eyebrow px-6 py-4 text-left">Slug</th>
                <th className="eyebrow px-6 py-4 text-left">Dono</th>
                <th className="eyebrow px-6 py-4 text-left">Status</th>
                <th className="eyebrow px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                    Nenhum estúdio ainda. Cadastre o primeiro acima.
                  </td>
                </tr>
              )}
              {items.map((s) => {
                const badge = STATUS_LABEL[s.status];
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-6 py-4 font-medium">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">/{s.slug}</td>
                    <td className="px-6 py-4 text-muted-foreground">{s.ownerEmail ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={badge.variant}>{badge.text}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <StudioActions studioId={s.id} status={s.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
