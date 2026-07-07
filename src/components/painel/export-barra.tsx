"use client";

import * as React from "react";
import { FileDown, Printer } from "lucide-react";

export function ExportBarra({
  blocos, baseQuery,
}: {
  blocos: { chave: string; titulo: string }[];
  baseQuery: string;
}) {
  const [selecionados, setSelecionados] = React.useState<string[]>(blocos.map((b) => b.chave));

  function alternar(chave: string) {
    setSelecionados((atual) => atual.includes(chave) ? atual.filter((c) => c !== chave) : [...atual, chave]);
  }

  const blocosParam = selecionados.join(",");
  const query = `${baseQuery}${baseQuery ? "&" : ""}blocos=${encodeURIComponent(blocosParam)}`;
  const csvHref = `/api/painel-estrategico/csv?${query}`;
  const pdfHref = `/imprimir/painel-estrategico?${query}`;
  const nenhum = selecionados.length === 0;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm font-medium">Relatório do período</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {blocos.map((b) => (
          <label key={b.chave} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={selecionados.includes(b.chave)}
              onChange={() => alternar(b.chave)}
              className="size-4 rounded border-input"
            />
            {b.titulo}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href={nenhum ? undefined : csvHref}
          download
          aria-disabled={nenhum}
          className={`inline-flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm font-medium transition-colors hover:bg-muted ${nenhum ? "pointer-events-none opacity-50" : ""}`}
        >
          <FileDown className="size-4" /> Baixar CSV
        </a>
        <a
          href={nenhum ? undefined : pdfHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={nenhum}
          className={`inline-flex h-9 items-center gap-2 rounded-md bg-brand-yellow px-3 text-sm font-semibold text-ink-900 transition-opacity hover:opacity-90 ${nenhum ? "pointer-events-none opacity-50" : ""}`}
        >
          <Printer className="size-4" /> Relatório em PDF
        </a>
      </div>
      {nenhum && <p className="text-xs text-destructive">Selecione ao menos um bloco.</p>}
    </div>
  );
}
