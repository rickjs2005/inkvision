import { notFound, redirect } from "next/navigation";
import { requireActor } from "@/server/auth-context";
import { studioRoleAtLeast } from "@inkvision/shared";
import { prisma } from "@inkvision/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete o cadastro do estúdio</CardTitle>
          <CardDescription>
            Preencha os dados para publicar o estúdio e começar a receber clientes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OnboardingForm studioId={studioId} defaultName={studio.name} />
        </CardContent>
      </Card>
    </div>
  );
}
