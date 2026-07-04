import type { StudioStatus } from "@inkvision/core";
import { listStudios } from "@/server/actions/studio";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Estúdios</h1>
        <p className="text-sm text-muted-foreground">{total} estúdio(s) na plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar estúdio</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateStudioForm />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 font-medium">Estúdio</th>
                  <th className="px-6 py-3 font-medium">Slug</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                      Nenhum estúdio ainda. Cadastre o primeiro acima.
                    </td>
                  </tr>
                )}
                {items.map((s) => {
                  const badge = STATUS_LABEL[s.status];
                  return (
                    <tr key={s.id} className="border-b border-border last:border-0">
                      <td className="px-6 py-4 font-medium">{s.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">/{s.slug}</td>
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
        </CardContent>
      </Card>
    </div>
  );
}
