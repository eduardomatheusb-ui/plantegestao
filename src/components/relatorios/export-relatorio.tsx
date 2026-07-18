import Link from "next/link";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RelKey = "dre" | "fluxo-caixa" | "lancamentos" | "por-cliente" | "terceiros";

/**
 * Botões de export de um relatório financeiro: CSV (Excel) e PDF (página de
 * impressão). Os dois levam os MESMOS filtros da tela — ano e, quando houver,
 * cliente ou fornecedor —, então o arquivo sai igual ao que está na frente do
 * usuário.
 */
export function ExportRelatorio({
  rel,
  ano,
  cliente,
  fornecedor,
}: {
  rel: RelKey;
  ano: number;
  cliente?: string;
  fornecedor?: string;
}) {
  const params = new URLSearchParams({ rel, ano: String(ano) });
  if (cliente) params.set("cliente", cliente);
  if (fornecedor) params.set("fornecedor", fornecedor);
  const qs = params.toString();

  return (
    <>
      <Button asChild variant="outline">
        <a href={`/api/relatorios/financeiro/csv?${qs}`} download>
          <Download className="size-4" />
          CSV
        </a>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/imprimir/relatorios/financeiro?${qs}`} target="_blank">
          <FileDown className="size-4" />
          PDF
        </Link>
      </Button>
    </>
  );
}
