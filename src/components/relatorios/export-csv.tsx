import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Botão "Exportar CSV" de um relatório financeiro. Aponta para o endpoint com os
 * MESMOS filtros da tela (ano, cliente, fornecedor) — o arquivo sai igual ao que
 * está na frente do usuário.
 */
export function ExportCSV({
  rel,
  ano,
  cliente,
  fornecedor,
}: {
  rel: "dre" | "fluxo-caixa" | "lancamentos" | "por-cliente" | "terceiros";
  ano: number;
  cliente?: string;
  fornecedor?: string;
}) {
  const params = new URLSearchParams({ rel, ano: String(ano) });
  if (cliente) params.set("cliente", cliente);
  if (fornecedor) params.set("fornecedor", fornecedor);

  return (
    <Button asChild variant="outline">
      <a href={`/api/relatorios/financeiro/csv?${params.toString()}`} download>
        <Download className="size-4" />
        Exportar CSV
      </a>
    </Button>
  );
}
