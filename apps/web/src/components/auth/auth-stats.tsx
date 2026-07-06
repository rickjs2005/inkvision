"use client";

import { createContext, useContext } from "react";
import type { PublicStats } from "@/lib/public-stats";

/**
 * As páginas de auth são client components; o layout (server) busca as
 * métricas reais e injeta aqui para o AuthProof consumir.
 */
const AuthStatsContext = createContext<PublicStats | null>(null);

export function AuthStatsProvider({
  stats,
  children,
}: {
  stats: PublicStats | null;
  children: React.ReactNode;
}) {
  return <AuthStatsContext.Provider value={stats}>{children}</AuthStatsContext.Provider>;
}

export function useAuthStats(): PublicStats | null {
  return useContext(AuthStatsContext);
}
