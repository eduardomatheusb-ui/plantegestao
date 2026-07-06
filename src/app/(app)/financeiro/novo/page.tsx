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
import type { LancamentoTipo } from "@prisma/client";

const TIPOS = new Set(["RECEITA", "DESPESA", "TRANSFERENCIA"]);

function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function NovoLancamentoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; projeto?: string; cliente?: string }>;
}) {
  await requirePapel("GESTOR");
  const sp = await searchParams;
  const tipo = (TIPOS.has(sp.tipo ?? "") ? sp.tipo : "RECEITA") as LancamentoTipo;

  const [categorias, fornecedores, clientes, centros, contas, projetos, jobs, colaboradores] = await Promise.all([
    tipo === "TRANSFERENCIA" ? Promise.resolve([]) : listarCategoriasPorTipo(tipo === "RECEITA" ? "RECEITA" : "DESPESA"),
    listarFornecedoresAtivos(),
    listarClientesAtivos(),
    listarCentrosCusto(),
    listarContas(),
    listarProjetosParaSelect(),
    db.job.findMany({ where: { arquivado: false }, orderBy: { numero: "desc" }, select: { id: true, numero: true, titulo: true } }),
    db.colaborador.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const sacados = tipo === "RECEITA" ? clientes : tipo === "DESPESA" ? fornecedores : [];
  const sacadoLabel = tipo === "RECEITA" ? "Cliente (sacado)" : "Fornecedor (cedente)";
  const hoje = hojeLocal();
  const inicial: LancamentoInicial = {
    dataVencimento: hoje,
    dataCompetencia: hoje,
    projetoId: sp.projeto,
    sacadoId: tipo === "RECEITA" ? sp.cliente : undefined,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Nova ${TIPO_LABEL[tipo].toLowerCase()}`} />
      <Card>
        <CardContent className="pt-6">
          <LancamentoForm
            id={null}
            tipo={tipo}
            inicial={inicial}
            sacados={sacados}
            sacadoLabel={sacadoLabel}
            categorias={categorias}
            centros={centros}
            contas={contas}
            projetos={projetos}
            jobs={jobs}
            colaboradores={colaboradores}
            cancelHref="/financeiro"
          />
        </CardContent>
      </Card>
    </div>
  );
}
