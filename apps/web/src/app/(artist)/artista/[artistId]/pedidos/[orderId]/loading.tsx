import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Carregando pedido"
      className="mx-auto max-w-4xl px-6 py-12"
    >
      <span className="sr-only">Carregando pedido…</span>

      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <Skeleton className="h-11 w-64" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="mt-10 grid gap-x-12 gap-y-12 md:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-10">
          <section className="flex flex-col gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </section>

          <section className="flex flex-col gap-4 border-t border-border pt-8">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-11 w-full max-w-sm" />
            <Skeleton className="h-11 w-32" />
          </section>

          <section className="flex flex-col gap-4 border-t border-border pt-8">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-48 w-full rounded-md" />
            <Skeleton className="h-11 w-full" />
          </section>
        </div>

        <aside className="flex h-fit flex-col gap-4 md:border-l md:border-border md:pl-10">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="mt-1 h-3 w-3 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
