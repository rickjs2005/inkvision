"use server";

import { getCurrentUser } from "@/server/auth-context";

/**
 * Só a sessão (sem memberships) — usado por CTAs em páginas públicas
 * estáticas/ISR (/t/[artistId], /s/[slug], /simular) pra decidir, depois da
 * hidratação no cliente, se o visitante já está logado.
 */
export async function isAuthedAction(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}
