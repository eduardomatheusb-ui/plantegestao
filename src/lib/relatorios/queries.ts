import { db } from "@/lib/db";
import type { LancRel } from "./calculo";

const incluir = {
  categoria: { select: { nome: true } },
  cliente: { select: { id: true, nome: true } },
  fornecedor: { select: { id: true, nome: true } },
  centroCusto: { select: { nome: true } },
} as const;

function intervaloAno(ano: number) {
  return { gte: new Date(ano, 0, 1), lt: new Date(ano + 1, 0, 1) };
}

/** Lançamentos de um ano (por competência), já com relações para os relatórios. */
export async function buscarLancamentosAno(ano: number) {
  return db.lancamento.findMany({
    where: { dataCompetencia: intervaloAno(ano) },
    orderBy: { dataCompetencia: "asc" },
    include: incluir,
  });
}

export async function buscarLancamentosCliente(clienteId: string, ano: number) {
  return db.lancamento.findMany({
    where: { clienteId, dataCompetencia: intervaloAno(ano) },
    orderBy: { dataCompetencia: "asc" },
    include: incluir,
  });
}

export async function buscarLancamentosFornecedor(fornecedorId: string, ano: number) {
  return db.lancamento.findMany({
    where: { fornecedorId, dataCompetencia: intervaloAno(ano) },
    orderBy: { dataCompetencia: "asc" },
    include: incluir,
  });
}

type LancComRel = Awaited<ReturnType<typeof buscarLancamentosAno>>[number];

/** Converte para o formato das funções de cálculo. */
export function paraLancRel(lancs: LancComRel[]): LancRel[] {
  return lancs.map((l) => ({
    tipo: l.tipo,
    status: l.status,
    categoriaNome: l.categoria?.nome ?? null,
    valor: Number(l.valor),
    acrescimos: Number(l.acrescimos),
    descontos: Number(l.descontos),
    mes: new Date(l.dataCompetencia).getMonth() + 1,
  }));
}
