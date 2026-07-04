import Link from "next/link";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { prisma } from "@inkvision/db";
import { Card, CardContent } from "@/components/ui/card";
import { Reveal, RevealItem, RevealStagger } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Estúdios",
  description: "Conheça os estúdios de tatuagem na InkVision.",
};

export const revalidate = 300;

const getStudios = unstable_cache(
  async () => {
    try {
      return await prisma.studio.findMany({
        where: { status: "ACTIVE" },
        select: { slug: true, name: true, description: true, addressCity: true, addressState: true },
        orderBy: { createdAt: "desc" },
        take: 48,
      });
    } catch {
      return [];
    }
  },
  ["public-studios"],
  { revalidate: 300, tags: ["public-studios"] },
);

export default async function StudiosPage() {
  const studios = await getStudios();
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <Reveal>
        <h1 className="text-3xl font-bold tracking-tight">Estúdios</h1>
        <p className="mt-1 text-muted-foreground">{studios.length} estúdio(s) na plataforma</p>
      </Reveal>

      {studios.length === 0 ? (
        <p className="mt-12 text-muted-foreground">Nenhum estúdio publicado ainda.</p>
      ) : (
        <RevealStagger className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {studios.map((s) => (
            <RevealItem key={s.slug}>
              <Link href={`/s/${s.slug}`}>
                <Card className="h-full transition-all hover:-translate-y-1 hover:border-primary hover:shadow-xl">
                  <CardContent className="p-5">
                    <p className="font-semibold">{s.name}</p>
                    {(s.addressCity || s.addressState) && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {[s.addressCity, s.addressState].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {s.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </RevealItem>
          ))}
        </RevealStagger>
      )}
    </div>
  );
}
