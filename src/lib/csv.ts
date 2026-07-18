/**
 * Utilitários de CSV para os exports do sistema.
 *
 * Padrão pensado para o Excel em português: separador ponto e vírgula, número
 * com vírgula decimal e BOM no início do arquivo (senão os acentos quebram).
 */

export const CSV_SEP = ";";

/** Escapa um campo (aspas, separador ou quebra de linha viram texto entre aspas). */
export function csvCampo(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Monta uma linha do CSV a partir dos campos. */
export function csvLinha(campos: unknown[]): string {
  return campos.map(csvCampo).join(CSV_SEP);
}

/** Número em formato pt-BR (vírgula decimal), para o Excel somar sem ajuste. */
export function csvNumero(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

/** Data em dd/mm/aaaa (vazio se não houver). */
export function csvData(d: Date | null | undefined): string {
  return d ? new Intl.DateTimeFormat("pt-BR").format(new Date(d)) : "";
}

/** Nome seguro para arquivo: sem acento, espaço ou caractere especial. */
export function slugArquivo(s: string): string {
  return (
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "arquivo"
  );
}

/** Resposta HTTP de download do CSV. */
export function respostaCSV(linhas: string[], nomeArquivo: string): Response {
  const conteudo = "﻿" + linhas.join("\r\n"); // BOM p/ acentos no Excel
  return new Response(conteudo, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
