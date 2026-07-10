import { requireActor, getCurrentUser } from "@/server/auth-context";
import { AppHeader } from "@/components/layout/app-header";

export default async function ArtistLayout({ children }: { children: React.ReactNode }) {
  const actor = await requireActor();
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader actor={actor} userName={user?.name ?? null} />
      {children}
    </div>
  );
}
