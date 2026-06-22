"use client";

import { useEffect } from "react";

/**
 * Boundary global de erro. Cobre falhas que escapam até a raiz — inclusive o
 * "ChunkLoadError" clássico (deploy novo enquanto a página estava aberta).
 * Nesse caso recarrega sozinho; nos demais, mostra uma mensagem amigável.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const ehChunk = /ChunkLoadError|Loading chunk|importing a module|dynamically imported/i.test(
    error?.message ?? "",
  );

  useEffect(() => {
    if (ehChunk) {
      // Versão antiga em cache tentou carregar um pedaço que mudou no deploy → recarrega.
      window.location.reload();
    }
  }, [ehChunk]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          background: "#f4f4f5",
          color: "#1a1a1a",
        }}
      >
        <div style={{ textAlign: "center", padding: 24, maxWidth: 420 }}>
          <p style={{ fontWeight: 800, fontSize: 28, letterSpacing: 1, color: "#050505", margin: 0 }}>
            TREM
          </p>
          <h1 style={{ fontSize: 18, margin: "16px 0 8px" }}>
            {ehChunk ? "Atualizando…" : "Algo deu errado"}
          </h1>
          <p style={{ fontSize: 14, color: "#52525b", lineHeight: 1.6, margin: "0 0 20px" }}>
            {ehChunk
              ? "Saiu uma versão nova. Recarregando a página para você."
              : "A página pode ter ficado desatualizada. Recarregue para continuar."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#F7FF19",
              color: "#050505",
              border: "none",
              fontWeight: 700,
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Recarregar
          </button>
          <button
            onClick={() => reset()}
            style={{
              marginLeft: 8,
              background: "transparent",
              color: "#52525b",
              border: "1px solid #e5e7eb",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
