import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <div className="text-2xl font-bold tracking-tight">
        <span className="text-primary">◈</span> InkVision
      </div>
      <p className="mt-8 text-6xl font-black tracking-tighter text-muted-foreground">404</p>
      <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        O link que você seguiu pode estar quebrado ou a página foi removida.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Voltar para o início</Link>
      </Button>
    </main>
  );
}
