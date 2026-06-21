import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { buscarLancamentosCliente } from "@/lib/relatorios/queries";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { YearNav } from "@/components/relatorios/year-nav";
import { ParamSelect } from "@/components/relatorios/param-select";
import { LancamentosReportTable } from "@/components/relatorios/lancamentos-table";
import { EmptyState } from "@/components/shared/empty-state";

export default async function PorClientePage({ searchParams }: { searchParams: Promise<{ ano?: string; cliente?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const ano = Number(sp.ano) || new Date().getFullYear();
  const clienteId = sp.cliente;

  const clientes = await listarClientesAtivos();
  const lancs = clienteId ? await buscarLancamentosCliente(clienteId, ano) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Movimentação por Cliente"
        descricao="Todas as receitas e despesas de um cliente no ano."
        acao={<Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button>}
      />
      <div className="flex flex-wrap items-center gap-3">
        <ParamSelect paramKey="cliente" options={clientes} placeholder="Selecione um cliente…" ariaLabel="Cliente" />
        <YearNav ano={ano} />
      </div>

      {clienteId ? (
        <LancamentosReportTable lancs={lancs} />
      ) : (
        <EmptyState titulo="Selecione um cliente" descricao="Escolha um cliente acima para ver a movimentação." />
      )}
    </div>
  );
}
