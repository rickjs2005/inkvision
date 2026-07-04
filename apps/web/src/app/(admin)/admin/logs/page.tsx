import { requirePlatformAdmin } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Logs de auditoria</h1>
        <p className="text-sm text-muted-foreground">{total} evento(s)</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Quando</th>
                  <th className="px-5 py-3 font-medium">Ação</th>
                  <th className="px-5 py-3 font-medium">Entidade</th>
                  <th className="px-5 py-3 font-medium">Estúdio</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                      Nenhum evento registrado.
                    </td>
                  </tr>
                )}
                {items.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-muted-foreground">{fmt.format(new Date(l.createdAt))}</td>
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
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        Página {page} · {perPage} por página
      </p>
    </div>
  );
}
