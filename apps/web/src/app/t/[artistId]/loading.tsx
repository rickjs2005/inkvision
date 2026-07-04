import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando perfil"
      className="mx-auto max-w-5xl px-6 py-12"
    >
      <span className="sr-only">Carregando perfil…</span>

      <header className="mb-8">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Skeleton className="h-4 w-full max-w-2xl" />
          <Skeleton className="h-4 w-4/5 max-w-2xl" />
        </div>
        <Skeleton className="mt-6 h-12 w-48 rounded-lg" />
      </header>

      <Skeleton className="mb-4 h-6 w-32" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
