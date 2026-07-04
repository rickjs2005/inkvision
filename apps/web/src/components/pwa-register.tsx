"use client";

import { useEffect } from "react";

/** Registra o service worker apenas em produção (evita cache atrapalhando o dev). */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
