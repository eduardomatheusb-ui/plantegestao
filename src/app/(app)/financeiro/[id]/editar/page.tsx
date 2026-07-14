import { notFound } from "next/navigation";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import {
  listarCategoriasPorTipo,
  listarFornecedoresAtivos,
  listarCentrosCusto,
  listarContas,
} from "@/lib/financeiro/queries";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { TIPO_LABEL } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/shared/page-header";
import { LancamentoForm, type LancamentoInicial } from "@/components/financeiro/lancamento-form";
import { Card, CardContent } from "@/components/ui/card";

function di(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditarLancamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePapel("GESTOR");

  const lanc = await db.lancamento.findUnique({ where: { id } });
  if (!lanc) notFound();

  const tipo = lanc.tipo;
  const [categorias, fornecedores, clientes, centros, contas, projetos, jobs, colaboradores, prestadores] = await Promise.all([
    tipo === "TRANSFERENCIA" ? Promise.resolve([]) : listarCategoriasPorTipo(tipo === "RECEITA" ? "RECEITA" : "DESPESA"),
    listarFornecedoresAtivos(),
    listarClientesAtivos(),
    listarCentrosCusto(),
    listarContas(),
    listarProjetosParaSelect(),
    db.job.findMany({ where: { arquivado: false }, orderBy: { numero: "desc" }, select: { id: true, numero: true, titulo: true } }),
    db.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.prestador.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const sacados = tipo === "RECEITA" ? clientes : tipo === "DESPESA" ? fornecedores : [];
  const sacadoLabel = tipo === "RECEITA" ? "Cliente (sacado)" : "Fornecedor (cedente)";

  const inicial: LancamentoInicial = {
    titulo: lanc.titulo,
    sacadoId: (tipo === "RECEITA" ? lanc.clienteId : lanc.fornecedorId) ?? "",
    categoriaId: lanc.categoriaId ?? "",
    dataVencimento: di(lanc.dataVencimento),
    dataCompetencia: di(lanc.dataCompetencia),
    dataFaturamento: di(lanc.dataFaturamento),
    dataPagamento: di(lanc.dataPagamento),
    valor: String(Number(lanc.valor)),
    acrescimos: String(Number(lanc.acrescimos)),
    descontos: String(Number(lanc.descontos)),
    condicao: lanc.condicao,
    docNf: lanc.docNf ?? "",
    observacao: lanc.observacao ?? "",
    projetoId: lanc.projetoId ?? "",
    jobId: lanc.jobId ?? "",
    centroCustoId: lanc.centroCustoId ?? "",
    beneficiario: lanc.fornecedorId
      ? `fornecedor:${lanc.fornecedorId}`
      : lanc.prestadorId
        ? `prestador:${lanc.prestadorId}`
        : lanc.colaboradorId
          ? `colaborador:${lanc.colaboradorId}`
          : "",
    contaId: lanc.contaId ?? "",
    contaDestinoId: lanc.contaDestinoId ?? "",
    quitado: lanc.status === "QUITADO",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ${TIPO_LABEL[tipo].toLowerCase()} #${lanc.numero}`} descricao={lanc.titulo} />
      <Card>
        <CardContent className="pt-6">
          <LancamentoForm
            id={id}
            tipo={tipo}
            inicial={inicial}
            sacados={sacados}
            sacadoLabel={sacadoLabel}
            categorias={categorias}
            centros={centros}
            contas={contas}
            projetos={projetos}
            jobs={jobs}
            fornecedores={fornecedores}
            prestadores={prestadores}
            colaboradores={colaboradores}
            cancelHref="/financeiro"
            jaParcelado={!!lanc.parcelaGrupo}
          />
        </CardContent>
      </Card>
    </div>
  );
}
