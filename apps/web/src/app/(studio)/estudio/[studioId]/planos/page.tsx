import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { studioRoleAtLeast } from "@inkvision/shared";
import { requireActor } from "@/server/auth-context";
import { repositories, useCases } from "@/server/container";
import { prisma } from "@inkvision/db";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ConnectButton, SubscribeButton } from "./billing-buttons";

export default async function PlansPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const actor = await requireActor();
  const membership = actor.memberships.find((m) => m.studioId === studioId);
  const isOwner = actor.platformRole === "ADMIN" || (membership && studioRoleAtLeast(membership.role, "OWNER"));
  if (!isOwner) notFound();

  const [studio, plans, active] = await Promise.all([
    prisma.studio.findUnique({ where: { id: studioId }, select: { name: true, stripeAccountId: true } }),
    prisma.plan.findMany({ orderBy: { priceCents: "asc" } }),
    repositories.subscriptions.getActiveForStudio(studioId),
  ]);
  if (!studio) notFound();

  // Status real da conta de recebimento (provedor). Falha do provedor não
  // derruba a página — mostra o estado neutro "Conectada".
  const account = studio.stripeAccountId
    ? await useCases.getPaymentsAccountStatus.execute(actor, studioId).catch(() => null)
    : null;

  // Destaque presentacional: nível intermediário quando há 3+, senão o topo.
  const recommendedIndex = plans.length >= 3 ? 1 : plans.length - 1;
  const recommendedSlug = plans[recommendedIndex]?.slug;

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Pagamentos & plano · {studio.name}</span>
      </div>
      <h1 className="mt-5 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
        Assinatura
      </h1>

      {/* Conta de recebimento */}
      <section className="mt-12 border-t border-border pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow text-muted-foreground">Conta de recebimento</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Conecte para receber os sinais e pagamentos dos clientes.
            </p>
          </div>
          {!studio.stripeAccountId ? (
            <ConnectButton studioId={studioId} />
          ) : account && !account.chargesEnabled ? (
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <div className="flex items-center gap-2">
                <Badge variant="warning">
                  {account.detailsSubmitted ? "Em análise" : "Onboarding pendente"}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">{account.accountId}</span>
              </div>
              {!account.detailsSubmitted && (
                <ConnectButton studioId={studioId} label="Completar onboarding" />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge variant="success">Conectada</Badge>
              <span className="font-mono text-xs text-muted-foreground">{studio.stripeAccountId}</span>
            </div>
          )}
        </div>
      </section>

      {/* Planos */}
      <section className="mt-16">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-border" />
          <span className="eyebrow text-muted-foreground">Escolha o plano</span>
        </div>

        <div className="mt-6 grid items-start gap-4 sm:grid-cols-3">
          {plans.map((p) => {
            const isCurrent = active?.planSlug === p.slug;
            const isRecommended = p.slug === recommendedSlug;
            const muted = isRecommended ? "text-background/55" : "text-muted-foreground";
            return (
              <div
                key={p.id}
                className={cn(
                  "relative flex flex-col rounded-lg border p-6",
                  isRecommended
                    ? "border-transparent bg-foreground text-background shadow-[var(--shadow-lift)] sm:-my-2 sm:py-8"
                    : "border-border bg-card",
                  isCurrent && !isRecommended && "border-primary/60",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg leading-tight">{p.name}</h3>
                  {isRecommended && (
                    <span className="rounded-[4px] bg-primary px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary-foreground">
                      Recomendado
                    </span>
                  )}
                  {isCurrent && !isRecommended && <Badge variant="success">Atual</Badge>}
                </div>

                <p className="mt-6 flex items-baseline gap-1">
                  <span className={cn("font-mono text-sm", muted)}>R$</span>
                  <span className="font-mono text-5xl font-light tracking-tight">
                    {(p.priceCents / 100).toFixed(0)}
                  </span>
                  <span className={cn("font-mono text-xs", muted)}>/mês</span>
                </p>

                <ul className="mt-6 flex flex-col gap-2.5 text-sm">
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-4 shrink-0", isRecommended ? "text-background" : "text-primary")} />
                    <span>
                      Até <span className="font-mono">{p.maxArtists}</span> tatuadores
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className={cn("size-4 shrink-0", isRecommended ? "text-background" : "text-primary")} />
                    <span>
                      <span className="font-mono">{p.aiCreditsMonthly}</span> créditos de IA/mês
                    </span>
                  </li>
                </ul>

                <div className="mt-8">
                  <SubscribeButton studioId={studioId} planSlug={p.slug} current={isCurrent} />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
