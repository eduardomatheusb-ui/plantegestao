/**
 * Monta o cabeçalho Content-Disposition aceitando nomes com acento.
 * Cabeçalhos HTTP só aceitam ASCII: o `filename` leva a versão sem acento
 * e o `filename*` (RFC 5987) leva o nome original em UTF-8.
 */
export function contentDisposition(nome: string | null | undefined, modo: "inline" | "attachment") {
  const limpo = (nome || "arquivo").replace(/[\r\n"\\]/g, "").trim() || "arquivo";
  const ascii = limpo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_");
  return `${modo}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(limpo)}`;
}
