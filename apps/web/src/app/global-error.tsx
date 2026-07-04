"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#141416",
          color: "#fafafa",
        }}
      >
        <div style={{ fontSize: "1.25rem", fontWeight: 700 }}>◈ InkVision</div>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>Algo deu errado</h1>
        <p style={{ maxWidth: "24rem", fontSize: "0.875rem", opacity: 0.7, margin: 0 }}>
          Ocorreu um erro inesperado. Tente recarregar a aplicação.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: "0.5rem",
            height: "2.5rem",
            padding: "0 1rem",
            borderRadius: "0.375rem",
            border: "none",
            background: "#fafafa",
            color: "#141416",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
