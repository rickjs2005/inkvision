import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { requirePlatformAdmin } from "@/server/auth-context";
import { useCases } from "@/server/container";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// `null` = a query dessa métrica falhou (ver PrismaMetricsRepository) — mostra
// "—" em vez de tratar como zero, que seria um dado real e diferente.
const brl = (cents: number | null) =>
  cents == null ? "—" : `R$ ${(cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
const fmt = (n: number | null) => (n == null ? "—" : String(n));
const monthLabel = (ym: string) => {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("pt-BR", { month: "short" });
};

// Com 1 mês só, a barra ocupa a largura toda e não comunica tendência
// nenhuma — melhor um estado vazio explícito do que um gráfico enganoso.
const MIN_MONTHS_FOR_CHART = 2;

// Métrica de destaque — numeral display grande, para a hierarquia primária.
function HeroMetric({
  eyebrow,
  value,
  hint,
  primary,
  className,
}: {
  eyebrow: string;
  value: string;
  hint?: string;
  primary?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("group bg-card p-6 transition-colors hover:bg-muted/20", className)}>
      <p className="eyebrow">{eyebrow}</p>
      <p
        className={cn(
          "mt-3 font-display font-light leading-[0.95] tracking-tight tabular-nums",
          primary ? "text-6xl sm:text-7xl" : "text-4xl sm:text-5xl",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Métrica secundária — numeral display menor, hierarquia abaixo das métricas de receita.
function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-card p-5 transition-colors hover:bg-muted/20">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl font-light tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>}
    </div>
  );
}

function PanelHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-border p-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1.5 font-display text-lg leading-tight">{title}</h2>
    </div>
  );
}

function BarList({ data }: { data: { key: string; count: number }[] | null }) {
  if (data === null) {
    return <p className="text-sm text-destructive">Indisponível agora — tente recarregar a página.</p>;
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Sem dados ainda.</p>;
  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => (
        <div key={d.key} className="flex items-center gap-4 text-sm">
          <span className="w-24 shrink-0 truncate capitalize text-muted-foreground">{d.key}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
          <span className="w-10 text-right font-mono tabular-nums">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const actor = await requirePlatformAdmin();
  const m = await useCases.getPlatformMetrics.execute(actor);

  const maxRev = Math.max(1, ...(m.monthlyRevenueCents ?? []).map((x) => x.cents));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-primary" />
            <span className="eyebrow">Administração · Visão geral</span>
          </div>
          <h1 className="mt-4 font-display text-4xl font-light tracking-tight sm:text-5xl">Dashboard</h1>
        </div>
        <Link
          href="/admin/logs"
          className="ink-link inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Ver logs <ArrowUpRight className="size-4" />
        </Link>
      </div>

      {/* Métricas primárias — receita, com o numeral principal maior. */}
      <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border shadow-[var(--shadow-ink)] lg:grid-cols-5">
        <HeroMetric
          primary
          className="lg:col-span-3"
          eyebrow="MRR · Receita recorrente"
          value={brl(m.mrrCents)}
          hint={`${fmt(m.subscriptions.active)} assinaturas ativas`}
        />
        <HeroMetric
          className="lg:col-span-2"
          eyebrow="Receita processada"
          value={brl(m.revenueCents)}
          hint={`Taxa da plataforma ${brl(m.platformFeeCents)}`}
        />
      </div>

      {/* Métricas secundárias — hairlines em vez de cards isolados. */}
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <Kpi
          label="Estúdios"
          value={fmt(m.studios.total)}
          hint={`${fmt(m.studios.active)} ativos · ${fmt(m.studios.pending)} onboarding`}
        />
        <Kpi label="Clientes" value={fmt(m.users)} hint={`${fmt(m.artists)} tatuadores`} />
        <Kpi label="Pedidos" value={fmt(m.orders.total)} hint={`${fmt(m.orders.completed)} concluídos`} />
        <Kpi label="Imagens de IA" value={fmt(m.aiImages)} hint="geradas na plataforma" />
        <Kpi label="Estúdios suspensos" value={fmt(m.studios.suspended)} />
        <Kpi label="Assinaturas ativas" value={fmt(m.subscriptions.active)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden p-0">
          <PanelHead eyebrow="Financeiro" title="Receita — últimos 6 meses" />
          <div className="p-6">
            {m.monthlyRevenueCents === null ? (
              <p className="text-sm text-destructive">Indisponível agora — tente recarregar a página.</p>
            ) : m.monthlyRevenueCents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem pagamentos nos últimos 6 meses.</p>
            ) : m.monthlyRevenueCents.length < MIN_MONTHS_FOR_CHART ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há dados suficientes para o gráfico — volte quando tiver pelo menos{" "}
                {MIN_MONTHS_FOR_CHART} meses de histórico.
              </p>
            ) : (
              <div className="flex h-44 items-end gap-3">
                {m.monthlyRevenueCents.map((x) => (
                  <div key={x.month} className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-sm bg-primary transition-all"
                        style={{ height: `${Math.max(4, (x.cents / maxRev) * 100)}%` }}
                        title={brl(x.cents)}
                      />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {monthLabel(x.month)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <PanelHead eyebrow="Inteligência artificial" title="Uso de IA por provider" />
          <div className="p-6">
            <BarList data={m.aiByProvider} />
          </div>
        </Card>

        <Card className="overflow-hidden p-0 lg:col-span-2">
          <PanelHead eyebrow="Assinaturas" title="Distribuição por plano" />
          <div className="p-6">
            <BarList data={m.subscriptions.byPlan} />
          </div>
        </Card>
      </div>
    </div>
  );
}
