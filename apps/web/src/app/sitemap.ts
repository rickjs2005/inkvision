import type { MetadataRoute } from "next";
import { TATTOO_STYLES } from "@inkvision/shared";
import { prisma } from "@inkvision/db";

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, changeFrequency: "daily", priority: 1 },
    { url: `${APP_URL}/tatuadores`, changeFrequency: "daily", priority: 0.9 },
    ...TATTOO_STYLES.map((s) => ({
      url: `${APP_URL}/tatuadores?estilo=${s.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  // Estúdios e artistas públicos (resiliente a banco indisponível no build).
  try {
    const [studios, artists] = await Promise.all([
      prisma.studio.findMany({ where: { status: "ACTIVE" }, select: { slug: true, updatedAt: true } }),
      prisma.artistProfile.findMany({
        where: { isActive: true, studio: { status: "ACTIVE" } },
        select: { id: true, updatedAt: true },
      }),
    ]);
    return [
      ...staticRoutes,
      ...studios.map((s) => ({
        url: `${APP_URL}/s/${s.slug}`,
        lastModified: s.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...artists.map((a) => ({
        url: `${APP_URL}/t/${a.id}`,
        lastModified: a.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
