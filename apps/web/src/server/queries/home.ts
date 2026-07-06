import "server-only";
import { unstable_cache } from "next/cache";
import type { Artist } from "@inkvision/core";
import { prisma, withAdmin } from "@inkvision/db";
import { useCases } from "@/server/container";
import type { PublicStats } from "@/lib/public-stats";

export const CACHE_TAGS = {
  topArtists: "home:top-artists",
  gallery: "home:gallery",
  publicStats: "home:public-stats",
} as const;

// Se a leitura falhar, o erro propaga e o unstable_cache NÃO grava — uma
// indisponibilidade momentânea do banco não pode virar 5 min de faixa vazia.
const cachedPublicStats = unstable_cache(
  async (): Promise<PublicStats> => {
    const [activeStudios, ratings, simulations] = await Promise.all([
      prisma.studio.count({ where: { status: "ACTIVE" } }),
      prisma.artistProfile.findMany({
        where: { isActive: true, ratingCount: { gt: 0 }, studio: { status: "ACTIVE" } },
        select: { ratingAvg: true, ratingCount: true },
      }),
      // AiUsageLog fica sob RLS — contagem cross-tenant via admin.
      withAdmin((tx) => tx.aiUsageLog.count({ where: { operation: "simulate" } })),
    ]);

    const ratingCount = ratings.reduce((n, r) => n + r.ratingCount, 0);
    const weighted = ratings.reduce((s, r) => s + Number(r.ratingAvg ?? 0) * r.ratingCount, 0);
    return {
      simulations,
      activeStudios,
      ratingAvg: ratingCount > 0 ? weighted / ratingCount : null,
      ratingCount,
    };
  },
  ["home-public-stats"],
  { revalidate: 300, tags: [CACHE_TAGS.publicStats] },
);

/**
 * Números reais de prova social (hero, diretórios, auth). `null` quando o
 * banco está indisponível — as telas escondem a faixa em vez de inventar.
 */
export async function getPublicStats(): Promise<PublicStats | null> {
  try {
    return await cachedPublicStats();
  } catch {
    return null;
  }
}

/** Melhores tatuadores (por avaliação). Resiliente a banco indisponível. */
export const getTopArtists = unstable_cache(
  async (): Promise<Artist[]> => {
    try {
      const { items } = await useCases.listPublicArtists.execute({ take: 8 });
      return items;
    } catch {
      return [];
    }
  },
  ["home-top-artists"],
  { revalidate: 300, tags: [CACHE_TAGS.topArtists] },
);

export interface GalleryItem {
  id: string;
  artistId: string;
  imageUrl: string;
  artistName: string;
}

/** Trabalhos recentes de estúdios ativos para a galeria da home. */
export const getGallery = unstable_cache(
  async (): Promise<GalleryItem[]> => {
    try {
      const rows = await prisma.portfolioItem.findMany({
        where: { studio: { status: "ACTIVE" }, artist: { isActive: true } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          artistId: true,
          type: true,
          mediaUrl: true,
          afterUrl: true,
          artist: { select: { user: { select: { name: true } } } },
        },
      });
      return rows.map((r) => ({
        id: r.id,
        artistId: r.artistId,
        imageUrl: r.type === "BEFORE_AFTER" && r.afterUrl ? r.afterUrl : r.mediaUrl,
        artistName: r.artist.user.name,
      }));
    } catch {
      return [];
    }
  },
  ["home-gallery"],
  { revalidate: 300, tags: [CACHE_TAGS.gallery] },
);
