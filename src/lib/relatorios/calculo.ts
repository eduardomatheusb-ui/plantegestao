import { round2, valorEfetivo } from "@/lib/financeiro/calculo";

export type LancRel = {
  tipo: "RECEITA" | "DESPESA" | "TRANSFERENCIA";
  status: "EM_ABERTO" | "QUITADO";
  categoriaNome: string | null;
  valor: number;
  acrescimos?: number;
  descontos?: number;
  mes: number; // 1..12 (competência)
};

export type LinhaDRE = { nome: string; valor: number };
export type DRE = {
  receitas: LinhaDRE[];
  despesas: LinhaDRE[];
  totalReceitas: number;
  totalDespesas: number;
  resultado: number;
};

/** Demonstrativo por competência: agrupa por categoria (receitas e despesas). */
export function agruparDRE(lancs: LancRel[]): DRE {
  const rec = new Map<string, number>();
  const desp = new Map<string, number>();
  for (const l of lancs) {
    if (l.tipo === "TRANSFERENCIA") continue;
    const v = valorEfetivo(l.valor, l.acrescimos, l.descontos);
    const nome = l.categoriaNome ?? "Sem categoria";
    const map = l.tipo === "RECEITA" ? rec : desp;
    map.set(nome, (map.get(nome) ?? 0) + v);
  }
  const toArr = (m: Map<string, number>) =>
    [...m].map(([nome, valor]) => ({ nome, valor: round2(valor) })).sort((a, b) => b.valor - a.valor);
  const receitas = toArr(rec);
  const despesas = toArr(desp);
  const totalReceitas = round2(receitas.reduce((a, r) => a + r.valor, 0));
  const totalDespesas = round2(despesas.reduce((a, r) => a + r.valor, 0));
  return { receitas, despesas, totalReceitas, totalDespesas, resultado: round2(totalReceitas - totalDespesas) };
}

export type MesFluxo = {
  mes: number;
  receitas: number;
  despesas: number;
  resultado: number;
  saldoAcumulado: number;
};

/** Fluxo de caixa anual: 12 meses com resultado e saldo acumulado. */
export function fluxoMensal(lancs: LancRel[]): MesFluxo[] {
  const meses: MesFluxo[] = Array.from({ length: 12 }, (_, i) => ({
    mes: i + 1,
    receitas: 0,
    despesas: 0,
    resultado: 0,
    saldoAcumulado: 0,
  }));
  for (const l of lancs) {
    if (l.tipo === "TRANSFERENCIA") continue;
    if (l.mes < 1 || l.mes > 12) continue;
    const v = valorEfetivo(l.valor, l.acrescimos, l.descontos);
    if (l.tipo === "RECEITA") meses[l.mes - 1].receitas += v;
    else meses[l.mes - 1].despesas += v;
  }
  let acc = 0;
  for (const m of meses) {
    m.receitas = round2(m.receitas);
    m.despesas = round2(m.despesas);
    m.resultado = round2(m.receitas - m.despesas);
    acc = round2(acc + m.resultado);
    m.saldoAcumulado = acc;
  }
  return meses;
}
