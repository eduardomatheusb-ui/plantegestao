import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireModulo } from "@/lib/permissoes.server";
import { buscarLancamentosAno, buscarLancamentosCliente, buscarLancamentosFornecedor, paraLancRel } from "@/lib/relatorios/queries";
import { agruparDRE, fluxoMensal } from "@/lib/relatorios/calculo";
import { valorEfetivo } from "@/lib/financeiro/calculo";
import { MESES, TIPO_LABEL, STATUS_LABEL } from "@/lib/financeiro/constants";
import { csvLinha, csvNumero, csvData, slugArquivo, respostaCSV } from "@/lib/csv";

export const dynamic = "force-dynamic";

type LancExport = Awaited<ReturnType<typeof buscarLancamentosAno>>[number];

/** Tabela de lançamentos — usada por Lançamentos, Por Cliente e Terceiros. */
function linhasLancamentos(lancs: LancExport[]): string[] {
  const linhas = [csvLinha(["Competencia", "Numero", "Titulo", "Tipo", "Categoria", "Sacado/Cedente", "Status", "Valor"])];
  for (const l of lancs) {
    const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
    linhas.push(csvLinha([
      csvData(l.dataCompetencia),
      l.numero,
      l.titulo,
      TIPO_LABEL[l.tipo],
      l.categoria?.nome ?? "",
      l.cliente?.nome ?? l.fornecedor?.nome ?? "",
      STATUS_LABEL[l.status],
      csvNumero(v),
    ]));
  }
  return linhas;
}

/** Exporta em CSV qualquer um dos relatórios financeiros (mesmos filtros da tela). */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });
  try {
    await requireModulo("relatorios", "VER");
  } catch {
    return new Response("Sem permissão", { status: 403 });
  }

  const url = new URL(req.url);
  const rel = url.searchParams.get("rel") ?? "";
  const ano = Number(url.searchParams.get("ano")) || new Date().getFullYear();

  if (rel === "dre") {
    const dre = agruparDRE(paraLancRel(await buscarLancamentosAno(ano)));
    const linhas = [csvLinha(["Grupo", "Categoria", "Valor"])];
    for (const r of dre.receitas) linhas.push(csvLinha(["Receita", r.nome, csvNumero(r.valor)]));
    linhas.push(csvLinha(["Receita", "TOTAL DE RECEITAS", csvNumero(dre.totalReceitas)]));
    for (const d of dre.despesas) linhas.push(csvLinha(["Despesa", d.nome, csvNumero(d.valor)]));
    linhas.push(csvLinha(["Despesa", "TOTAL DE DESPESAS", csvNumero(dre.totalDespesas)]));
    linhas.push(csvLinha(["Resultado", "RESULTADO DO ANO", csvNumero(dre.resultado)]));
    return respostaCSV(linhas, `dre-${ano}.csv`);
  }

  if (rel === "fluxo-caixa") {
    const fluxo = fluxoMensal(paraLancRel(await buscarLancamentosAno(ano)));
    const linhas = [csvLinha(["Mes", "Receitas", "Despesas", "Resultado", "Saldo acumulado"])];
    for (const m of fluxo) {
      linhas.push(csvLinha([MESES[m.mes - 1], csvNumero(m.receitas), csvNumero(m.despesas), csvNumero(m.resultado), csvNumero(m.saldoAcumulado)]));
    }
    const totalRec = fluxo.reduce((a, m) => a + m.receitas, 0);
    const totalDesp = fluxo.reduce((a, m) => a + m.despesas, 0);
    linhas.push(csvLinha(["TOTAL DO ANO", csvNumero(totalRec), csvNumero(totalDesp), csvNumero(totalRec - totalDesp), ""]));
    return respostaCSV(linhas, `fluxo-de-caixa-${ano}.csv`);
  }

  if (rel === "lancamentos") {
    return respostaCSV(linhasLancamentos(await buscarLancamentosAno(ano)), `lancamentos-${ano}.csv`);
  }

  if (rel === "por-cliente") {
    const clienteId = url.searchParams.get("cliente");
    if (!clienteId) return new Response("Selecione um cliente antes de exportar.", { status: 400 });
    const cliente = await db.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } });
    if (!cliente) return new Response("Cliente não encontrado", { status: 404 });
    const lancs = await buscarLancamentosCliente(clienteId, ano);
    return respostaCSV(linhasLancamentos(lancs), `movimentacao-${slugArquivo(cliente.nome)}-${ano}.csv`);
  }

  if (rel === "terceiros") {
    const fornecedorId = url.searchParams.get("fornecedor");
    if (!fornecedorId) return new Response("Selecione um fornecedor antes de exportar.", { status: 400 });
    const fornecedor = await db.fornecedor.findUnique({ where: { id: fornecedorId }, select: { nome: true } });
    if (!fornecedor) return new Response("Fornecedor não encontrado", { status: 404 });
    const lancs = await buscarLancamentosFornecedor(fornecedorId, ano);
    return respostaCSV(linhasLancamentos(lancs), `terceiros-${slugArquivo(fornecedor.nome)}-${ano}.csv`);
  }

  return new Response("Relatório desconhecido", { status: 400 });
}
