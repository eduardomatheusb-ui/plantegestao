import { db } from "@/lib/db";
import { resumoMes, valorEfetivo } from "./calculo";
import { MESES } from "./constants";

export async function listarLancamentosMes(ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);
  return db.lancamento.findMany({
    where: { dataCompetencia: { gte: inicio, lt: fim } },
    orderBy: [{ dataVencimento: "asc" }, { numero: "asc" }],
    include: {
      cliente: { select: { id: true, nome: true } },
      fornecedor: { select: { id: true, nome: true } },
      categoria: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      job: { select: { id: true, numero: true, titulo: true } },
      conta: { select: { id: true, nome: true } },
      contaDestino: { select: { id: true, nome: true } },
    },
  });
}

export async function resumoDoMes(ano: number, mes: number) {
  const lancs = await listarLancamentosMes(ano, mes);
  return resumoMes(
    lancs.map((l) => ({
      tipo: l.tipo,
      status: l.status,
      valor: Number(l.valor),
      acrescimos: Number(l.acrescimos),
      descontos: Number(l.descontos),
    })),
  );
}

/** Série dos últimos `n` meses (receitas × despesas) para o gráfico. */
export async function serieUltimosMeses(ano: number, mes: number, n = 6) {
  const fim = new Date(ano, mes, 1);
  const inicio = new Date(ano, mes - (n - 1) - 1, 1);
  const lancs = await db.lancamento.findMany({
    where: { dataCompetencia: { gte: inicio, lt: fim }, tipo: { in: ["RECEITA", "DESPESA"] } },
    select: { tipo: true, valor: true, acrescimos: true, descontos: true, dataCompetencia: true },
  });

  const buckets: { ano: number; mes: number; label: string; receitas: number; despesas: number }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(ano, mes - (n - 1) - 1 + i, 1);
    buckets.push({ ano: d.getFullYear(), mes: d.getMonth() + 1, label: MESES[d.getMonth()].slice(0, 3), receitas: 0, despesas: 0 });
  }

  for (const l of lancs) {
    const d = new Date(l.dataCompetencia);
    const b = buckets.find((x) => x.ano === d.getFullYear() && x.mes === d.getMonth() + 1);
    if (!b) continue;
    const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
    if (l.tipo === "RECEITA") b.receitas += v;
    else b.despesas += v;
  }
  return buckets;
}

export async function obterLancamento(id: string) {
  return db.lancamento.findUnique({ where: { id } });
}

// ── Opções para os formulários ──────────────────────────────────────────

export function listarCategoriasPorTipo(tipo: "RECEITA" | "DESPESA") {
  return db.categoria.findMany({ where: { ativo: true, tipo }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
export function listarFornecedoresAtivos() {
  return db.fornecedor.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
export function listarCentrosCusto() {
  return db.centroCusto.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
export function listarContas() {
  return db.contaBancaria.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } });
}
