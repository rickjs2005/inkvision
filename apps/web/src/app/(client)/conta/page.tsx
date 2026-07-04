import { requireActor } from "@/server/auth-context";
import { getCurrentUser } from "@/server/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LgpdPanel } from "./lgpd-panel";

export default async function AccountPage() {
  await requireActor();
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold">Conta & privacidade</h1>
      {user && (
        <p className="mt-1 text-sm text-muted-foreground">
          {user.name} · {user.email}
        </p>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Seus dados (LGPD)</CardTitle>
        </CardHeader>
        <CardContent>
          <LgpdPanel />
        </CardContent>
      </Card>
    </div>
  );
}
