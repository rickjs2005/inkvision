import Link from "next/link";
import { requirePlatformAdmin } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const brl = (cents: number) => `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
};

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function BarList({ data }: { data: { key: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  return (
    <div className="flex flex-col gap-2">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 truncate capitalize text-muted-foreground">{d.key}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="w-8 text-right font-medium">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const actor = await requirePlatformAdmin();
  const m = await useCases.getPlatformMetrics.execute(actor);

  const maxRev = Math.max(1, ...m.monthlyRevenueCents.map((x) => x.cents));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link href="/admin/logs" className="text-sm text-primary hover:underline">
          Ver logs →
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="MRR" value={brl(m.mrrCents)} hint={`${m.subscriptions.active} assinaturas ativas`} />
        <Kpi label="Receita processada" value={brl(m.revenueCents)} hint={`taxa da plataforma ${brl(m.platformFeeCents)}`} />
        <Kpi label="Estúdios" value={String(m.studios.total)} hint={`${m.studios.active} ativos · ${m.studios.pending} onboarding`} />
        <Kpi label="Clientes" value={String(m.users)} hint={`${m.artists} tatuadores`} />
        <Kpi label="Pedidos" value={String(m.orders.total)} hint={`${m.orders.completed} concluídos`} />
        <Kpi label="Imagens de IA geradas" value={String(m.aiImages)} />
        <Kpi label="Estúdios suspensos" value={String(m.studios.suspended)} />
        <Kpi label="Assinaturas ativas" value={String(m.subscriptions.active)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receita (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {m.monthlyRevenueCents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pagamentos ainda.</p>
            ) : (
              <div className="flex h-40 items-end gap-3">
                {m.monthlyRevenueCents.map((x) => (
                  <div key={x.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${Math.max(4, (x.cents / maxRev) * 100)}%` }}
                        title={brl(x.cents)}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{monthLabel(x.month)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso de IA por provider</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={m.aiByProvider} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assinaturas por plano</CardTitle>
          </CardHeader>
          <CardContent>
            <BarList data={m.subscriptions.byPlan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
