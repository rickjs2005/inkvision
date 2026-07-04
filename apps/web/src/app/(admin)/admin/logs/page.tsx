import { requirePlatformAdmin } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const fmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" });

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const actor = await requirePlatformAdmin();
  const sp = await searchParams;
  const { items, total, page, perPage } = await useCases.listAuditLogs.execute(actor, {
    page: Number(sp.page) || 1,
    action: sp.q,
  });

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">Administração · Auditoria</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl">Logs</h1>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          {String(total).padStart(2, "0")} evento(s)
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="eyebrow px-5 py-3 text-left">Quando</th>
                <th className="eyebrow px-5 py-3 text-left">Ação</th>
                <th className="eyebrow px-5 py-3 text-left">Entidade</th>
                <th className="eyebrow px-5 py-3 text-left">Estúdio</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center font-sans text-muted-foreground">
                    Nenhum evento registrado.
                  </td>
                </tr>
              )}
              {items.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="whitespace-nowrap px-5 py-3 tabular-nums text-muted-foreground">
                    {fmt.format(new Date(l.createdAt))}
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant="neutral">{l.action}</Badge>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {l.entity} · {l.entityId.slice(0, 8)}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{l.studioId?.slice(0, 8) ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Página {String(page).padStart(2, "0")} · {perPage} por página
      </p>
    </div>
  );
}
