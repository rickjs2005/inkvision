import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/server/auth-context";
import { studioRoleAtLeast } from "@inkvision/shared";
import { prisma } from "@inkvision/db";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ studioId: string }>;
}) {
  const { studioId } = await params;
  const actor = await requireActor();

  const membership = actor.memberships.find((m) => m.studioId === studioId);
  const isOwner = membership && studioRoleAtLeast(membership.role, "OWNER");
  if (!isOwner && actor.platformRole !== "ADMIN") notFound();

  const studio = await prisma.studio.findUnique({
    where: { id: studioId },
    select: { name: true, status: true },
  });
  if (!studio) notFound();
  if (studio.status === "ACTIVE") redirect("/painel");

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">Onboarding · {studio.name}</span>
      </div>
      <h1 className="mt-5 font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
        Complete o cadastro
        <br />
        do estúdio
      </h1>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
        Preencha os dados abaixo para publicar o ateliê e começar a receber
        clientes.
      </p>

      <div className="mt-10 border-t border-border pt-10">
        <OnboardingForm studioId={studioId} defaultName={studio.name} />
      </div>
    </div>
  );
}
