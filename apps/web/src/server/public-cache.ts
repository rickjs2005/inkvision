import "server-only";
import { unstable_cache } from "next/cache";
import { DomainError } from "@inkvision/core";
import { useCases } from "@/server/container";

/**
 * Wrappers de leitura cacheada para as páginas públicas.
 *
 * PRINCÍPIO: só cacheamos leituras que NÃO dependem do viewer (nada de
 * headers/cookies/actor aqui dentro). Estado "curtido pelo viewer",
 * autorização e prévia de dono ficam FORA do cache — na página.
 *
 * unstable_cache exige chave estável: incluímos os parâmetros dinâmicos nas
 * keyParts. NOT_FOUND é capturado e vira `null` (nunca jogamos dentro do cache).
 */

const ARTIST_TTL = 300;
const DISCOVERY_TTL = 120;

function isNotFound(e: unknown): boolean {
  return e instanceof DomainError && e.code === "NOT_FOUND";
}

/** Perfil público do tatuador (sem actor → só ativos). */
export function getPublicArtist(artistId: string) {
  return unstable_cache(
    async () => {
      try {
        return await useCases.getArtist.execute(artistId, null);
      } catch (e) {
        if (isNotFound(e)) return null;
        throw e;
      }
    },
    ["public-artist", artistId],
    { tags: [`artist:${artistId}`], revalidate: ARTIST_TTL },
  )();
}

/** Avaliações públicas do tatuador (máx. 12, igual à página). */
export function getPublicArtistReviews(artistId: string) {
  return unstable_cache(
    async () => {
      try {
        return await useCases.listArtistReviews.execute(artistId, 12);
      } catch (e) {
        if (isNotFound(e)) return [];
        throw e;
      }
    },
    ["public-artist-reviews", artistId],
    { tags: [`artist-reviews:${artistId}`], revalidate: ARTIST_TTL },
  )();
}

/** Estúdio público por slug (sem actor → só ACTIVE). */
export function getPublicStudio(slug: string) {
  return unstable_cache(
    async () => {
      try {
        return await useCases.getStudioBySlug.execute(slug, null);
      } catch (e) {
        if (isNotFound(e)) return null;
        throw e;
      }
    },
    ["public-studio", slug],
    { tags: [`studio:${slug}`], revalidate: ARTIST_TTL },
  )();
}

export interface DiscoveryParams {
  styleSlug?: string;
  query?: string;
  skip?: number;
  take?: number;
}

/**
 * Vitrine pública de tatuadores (mesma leitura da página /tatuadores).
 * Os filtros entram nas keyParts para manter a chave estável por combinação.
 */
export function getDiscoveryArtists(params: DiscoveryParams) {
  const styleSlug = params.styleSlug;
  const query = params.query;
  const skip = params.skip ?? 0;
  const take = params.take ?? 12;
  return unstable_cache(
    async () => useCases.listPublicArtists.execute({ styleSlug, query, skip, take }),
    ["discovery-artists", styleSlug ?? "", query ?? "", String(skip), String(take)],
    { tags: ["artists-discovery"], revalidate: DISCOVERY_TTL },
  )();
}
