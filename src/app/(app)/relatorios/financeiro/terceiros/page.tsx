import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { buscarLancamentosFornecedor } from "@/lib/relatorios/queries";
import { listarFornecedoresAtivos } from "@/lib/financeiro/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { YearNav } from "@/components/relatorios/year-nav";
import { ParamSelect } from "@/components/relatorios/param-select";
import { LancamentosReportTable } from "@/components/relatorios/lancamentos-table";
import { EmptyState } from "@/components/shared/empty-state";

export default async function TerceirosPage({ searchParams }: { searchParams: Promise<{ ano?: string; fornecedor?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const ano = Number(sp.ano) || new Date().getFullYear();
  const fornecedorId = sp.fornecedor;

  const fornecedores = await listarFornecedoresAtivos();
  const lancs = fornecedorId ? await buscarLancamentosFornecedor(fornecedorId, ano) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Movimentação de Terceiros"
        descricao="Movimentação financeira por fornecedor no ano."
        acao={<Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button>}
      />
      <div className="flex flex-wrap items-center gap-3">
        <ParamSelect paramKey="fornecedor" options={fornecedores} placeholder="Selecione um fornecedor…" ariaLabel="Fornecedor" />
        <YearNav ano={ano} />
      </div>

      {fornecedorId ? (
        <LancamentosReportTable lancs={lancs} />
      ) : (
        <EmptyState titulo="Selecione um fornecedor" descricao="Escolha um fornecedor acima para ver a movimentação." />
      )}
    </div>
  );
}
