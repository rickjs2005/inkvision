import { requireActor } from "@/server/auth-context";
import { getCurrentUser } from "@/server/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EditProfileForm } from "./edit-profile-form";
import { ChangePasswordForm } from "./change-password-form";
import { LgpdPanel } from "./lgpd-panel";

export default async function AccountPage() {
  await requireActor();
  const user = await getCurrentUser();
  const phone = (user as { phone?: string | null } | null)?.phone ?? null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Conta & privacidade</h1>
        {user && (
          <p className="mt-1 text-sm text-muted-foreground">
            {user.name} · {user.email}
          </p>
        )}
      </div>

      {user && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Meus dados</CardTitle>
          </CardHeader>
          <CardContent>
            <EditProfileForm name={user.name} phone={phone} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

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
