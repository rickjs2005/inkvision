import "server-only";
import { unstable_cache } from "next/cache";
import type { Artist } from "@inkvision/core";
import { prisma } from "@inkvision/db";
import { useCases } from "@/server/container";

export const CACHE_TAGS = {
  topArtists: "home:top-artists",
  gallery: "home:gallery",
} as const;

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
