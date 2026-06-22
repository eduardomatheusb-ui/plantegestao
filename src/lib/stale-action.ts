/**
 * Detecta o erro de "Server Action não encontrada" / chunk antigo — que acontece
 * quando saiu um deploy novo enquanto a aba estava aberta (o ID da action mudou).
 * Nesses casos, recarregar a página resolve: o navegador baixa o bundle novo.
 */
export function ehErroStale(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e ?? "");
  return /Server Action|was not found on the server|Failed to find Server Action|ChunkLoadError|Loading chunk|dynamically imported/i.test(m);
}

/** Se o erro for de versão antiga, recarrega a página e devolve true. */
export function recarregarSeStale(e: unknown): boolean {
  if (typeof window !== "undefined" && ehErroStale(e)) {
    window.location.reload();
    return true;
  }
  return false;
}
