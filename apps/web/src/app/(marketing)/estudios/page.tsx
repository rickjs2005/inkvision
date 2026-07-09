import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { ArrowUpRight, MapPin } from "lucide-react";
import { prisma } from "@inkvision/db";
import { getPublicStats } from "@/server/queries/home";
import { ProofStrip } from "@/components/marketing/proof-strip";
import { logError } from "@/lib/logger";

export const metadata: Metadata = {
  title: "Estúdios",
  description: "Conheça os estúdios de tatuagem na InkVision.",
};

export const revalidate = 300;

// IMPORTANTE: não engolir exceções aqui dentro — se a query falhar, o erro deve
// propagar para fora de unstable_cache. Se fosse capturado e convertido em `[]`
// aqui, o Next cachearia esse `[]` por `revalidate` segundos e mascararia uma
// falha real de banco como "nenhum estúdio publicado" pelo período do cache.
const getStudios = unstable_cache(
  async () => {
    return prisma.studio.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, name: true, description: true, addressCity: true, addressState: true },
      orderBy: { createdAt: "desc" },
      take: 48,
    });
  },
  ["public-studios"],
  { revalidate: 300, tags: ["public-studios"] },
);

export default async function StudiosPage() {
  // Dispara as duas buscas em paralelo, mas trata a falha da listagem de
  // estúdios isoladamente — um erro aqui não deve derrubar as estatísticas
  // (que usam outra query) nem ser confundido com "lista vazia" genuína.
  const studiosPromise = getStudios().catch((err) => {
    logError(err, { scope: "estudios-page", query: "public-studios" });
    return null;
  });
  const stats = await getPublicStats();
  const studiosResult = await studiosPromise;
  const loadFailed = studiosResult === null;
  const studios = studiosResult ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Cabeçalho editorial */}
      <div className="flex items-center gap-3">
        <span className="h-px w-8 bg-primary" />
        <span className="eyebrow">O diretório · Ateliês & estúdios</span>
      </div>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-5xl font-light leading-[0.95] tracking-[-0.025em] sm:text-6xl">
          Estúdios
        </h1>
        <p className="font-mono text-sm text-muted-foreground">
          {loadFailed
            ? "— indisponível"
            : `${String(studios.length).padStart(2, "0")} ${studios.length === 1 ? "estúdio" : "estúdios"}`}
        </p>
      </div>

      {/* Faixa de prova social — números reais da rede */}
      <ProofStrip stats={stats} show={["rating", "simulations", "reviews"]} />

      {loadFailed ? (
        <p className="mt-16 font-display text-2xl text-destructive" role="alert">
          Não foi possível carregar os estúdios agora. Tente novamente em alguns instantes.
        </p>
      ) : studios.length === 0 ? (
        <p className="mt-16 font-display text-2xl text-muted-foreground">
          Nenhum estúdio publicado ainda.
        </p>
      ) : (
        <ul className="mt-8 border-t border-border">
          {studios.map((s, i) => {
            const location = [s.addressCity, s.addressState].filter(Boolean).join(" · ");
            return (
              <li key={s.slug}>
                <Link
                  href={`/s/${s.slug}`}
                  className="group grid grid-cols-[2rem_1fr_auto] items-center gap-4 border-b border-border py-6 transition-colors hover:bg-muted/40 sm:grid-cols-[3rem_1.4fr_1fr_auto] sm:gap-6 sm:px-2"
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <span className="font-display text-2xl leading-tight transition-colors group-hover:text-primary sm:text-3xl">
                      {s.name}
                    </span>
                    {s.description && (
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    {location && (
                      <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                        <MapPin className="size-3.5" />
                        {location}
                      </span>
                    )}
                  </div>
                  <ArrowUpRight className="size-5 justify-self-end text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
