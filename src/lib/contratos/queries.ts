import "server-only";
import { db } from "@/lib/db";

const num = (v: unknown) => (v == null ? null : Number(v));

export async function listarContratos() {
  const contratos = await db.contrato.findMany({
    orderBy: [{ status: "asc" }, { atualizadoEm: "desc" }],
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  return contratos.map((c) => ({ ...c, valorMensal: num(c.valorMensal), valorTotal: num(c.valorTotal) }));
}

export async function obterContrato(id: string) {
  const c = await db.contrato.findUnique({
    where: { id },
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });
  if (!c) return null;
  return { ...c, valorMensal: num(c.valorMensal), valorTotal: num(c.valorTotal) };
}

/** Fichamento anual: o que foi fechado (dataInicio no ano) — recorrentes e pontuais. */
export async function fichamentoAno(ano: number) {
  const ini = new Date(ano, 0, 1);
  const fim = new Date(ano + 1, 0, 1);
  const contratos = await db.contrato.findMany({
    where: { dataInicio: { gte: ini, lt: fim } },
    orderBy: { dataInicio: "asc" },
    include: { cliente: { select: { id: true, nome: true, nomeFantasia: true } } },
  });

  let mrrNovo = 0, pontualTotal = 0, qtdRecorrente = 0, qtdPontual = 0;
  const porServico = new Map<string, { qtd: number; total: number }>();
  for (const c of contratos) {
    if (c.tipo === "pontual") {
      qtdPontual += 1;
      const v = Number(c.valorTotal ?? 0);
      pontualTotal += v;
      const s = c.servico || "Outro";
      const e = porServico.get(s) ?? { qtd: 0, total: 0 };
      e.qtd += 1; e.total += v; porServico.set(s, e);
    } else {
      qtdRecorrente += 1;
      mrrNovo += Number(c.valorMensal ?? 0);
    }
  }

  return {
    ano,
    contratos: contratos.map((c) => ({ ...c, valorMensal: num(c.valorMensal), valorTotal: num(c.valorTotal) })),
    qtd: contratos.length,
    qtdRecorrente,
    qtdPontual,
    mrrNovo,
    pontualTotal,
    porServico: [...porServico.entries()].map(([servico, e]) => ({ servico, ...e })).sort((a, b) => b.total - a.total),
  };
}

/** Anos que têm contratos (para o seletor do fichamento). */
export async function anosComContrato(): Promise<number[]> {
  const rows = await db.contrato.findMany({ select: { dataInicio: true } });
  const anos = new Set(rows.map((r) => new Date(r.dataInicio).getFullYear()));
  anos.add(new Date().getFullYear());
  return [...anos].sort((a, b) => b - a);
}

/** MRR = soma do fee mensal dos contratos RECORRENTES ativos (pontuais não entram). */
export async function resumoMrr() {
  const ativos = await db.contrato.findMany({ where: { status: "ativo", tipo: "recorrente" }, select: { valorMensal: true } });
  const mrr = ativos.reduce((s, c) => s + Number(c.valorMensal ?? 0), 0);
  return { mrr, arr: mrr * 12, contratosAtivos: ativos.length };
}
