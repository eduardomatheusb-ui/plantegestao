import { notFound } from "next/navigation";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { listarFornecedoresAtivos } from "@/lib/financeiro/queries";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ProducaoForm, type ProducaoInicial } from "@/components/producao/producao-form";
import { Card, CardContent } from "@/components/ui/card";

function di(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditarProducaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePapel("GESTOR");

  const [ordem, clientes, fornecedores, projetos] = await Promise.all([
    db.producaoOrdem.findUnique({ where: { id } }),
    listarClientesAtivos(),
    listarFornecedoresAtivos(),
    listarProjetosParaSelect(),
  ]);
  if (!ordem) notFound();

  const inicial: ProducaoInicial = {
    titulo: ordem.titulo,
    clienteId: ordem.clienteId,
    fornecedorId: ordem.fornecedorId ?? "",
    projetoId: ordem.projetoId ?? "",
    versao: String(ordem.versao),
    dataEntrega: di(ordem.dataEntrega),
    vencimento: di(ordem.vencimento),
    formaPagamento: ordem.formaPagamento ?? "",
    comissaoPct: String(Number(ordem.comissaoPct)),
    observacao: ordem.observacao ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ordem de produção #${ordem.numero}`} descricao={ordem.titulo} />
      <Card>
        <CardContent className="pt-6">
          <ProducaoForm id={id} inicial={inicial} clientes={clientes} fornecedores={fornecedores} projetos={projetos} cancelHref={`/producao/${id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
