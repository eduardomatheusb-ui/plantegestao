import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { buscarLancamentosAno } from "@/lib/relatorios/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { YearNav } from "@/components/relatorios/year-nav";
import { ExportRelatorio } from "@/components/relatorios/export-relatorio";
import { LancamentosReportTable } from "@/components/relatorios/lancamentos-table";

export default async function LancamentosReportPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await requireModulo("relatorios", "VER");
  const sp = await searchParams;
  const ano = Number(sp.ano) || new Date().getFullYear();
  const lancs = await buscarLancamentosAno(ano);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Lançamentos"
        descricao="Receitas e despesas do ano, com comparativo previsto × realizado."
        acao={<div className="flex flex-wrap gap-2"><ExportRelatorio rel="lancamentos" ano={ano} /><Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button></div>}
      />
      <YearNav ano={ano} />
      <LancamentosReportTable lancs={lancs} />
    </div>
  );
}
