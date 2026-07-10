import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton genérico dos grupos autenticados — usado pelos loading.tsx de
 * (client), (artist) e (studio) para que navegações dentro do grupo mostrem
 * progresso imediato sob o AppHeader em vez de congelar a tela anterior.
 * Páginas com formato próprio (ex.: pedidos/[orderId]) têm skeleton dedicado.
 */
export function PageSkeleton({ label = "Carregando página" }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="mx-auto max-w-6xl px-6 py-12">
      <span className="sr-only">{label}…</span>

      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex flex-col gap-2 pt-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
