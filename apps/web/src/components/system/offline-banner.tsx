"use client";

import { useEffect, useState } from "react";

/**
 * Sem isso, navegar sem rede cai direto na tela nativa do Chrome
 * (chrome-error://chromewebdata) — nenhuma UI do app. Mostra um aviso fixo
 * enquanto `navigator.onLine` for false e some assim que a conexão volta.
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] bg-amber-600 px-4 py-2 text-center text-sm font-medium text-white shadow-md"
    >
      Você está sem conexão. Algumas ações podem não funcionar.
    </div>
  );
}
