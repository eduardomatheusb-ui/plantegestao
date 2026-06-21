export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Valor efetivo do lançamento: valor + acréscimos − descontos. */
export function valorEfetivo(valor: number, acrescimos = 0, descontos = 0): number {
  return round2((valor || 0) + (acrescimos || 0) - (descontos || 0));
}

export type LancamentoCalculo = {
  tipo: "RECEITA" | "DESPESA" | "TRANSFERENCIA";
  status: "EM_ABERTO" | "QUITADO";
  valor: number;
  acrescimos?: number;
  descontos?: number;
};

export type ResumoMes = {
  receitas: number;
  despesas: number;
  saldo: number; // previsto (todos)
  receitasRealizadas: number;
  despesasRealizadas: number;
  saldoRealizado: number; // apenas quitados
};

/**
 * Resumo do mês. Transferências não entram em receitas/despesas (são neutras
 * no resultado — apenas movem saldo entre contas).
 */
export function resumoMes(lancamentos: LancamentoCalculo[]): ResumoMes {
  let receitas = 0;
  let despesas = 0;
  let receitasRealizadas = 0;
  let despesasRealizadas = 0;

  for (const l of lancamentos) {
    const v = valorEfetivo(l.valor, l.acrescimos, l.descontos);
    const quitado = l.status === "QUITADO";
    if (l.tipo === "RECEITA") {
      receitas += v;
      if (quitado) receitasRealizadas += v;
    } else if (l.tipo === "DESPESA") {
      despesas += v;
      if (quitado) despesasRealizadas += v;
    }
  }

  receitas = round2(receitas);
  despesas = round2(despesas);
  receitasRealizadas = round2(receitasRealizadas);
  despesasRealizadas = round2(despesasRealizadas);

  return {
    receitas,
    despesas,
    saldo: round2(receitas - despesas),
    receitasRealizadas,
    despesasRealizadas,
    saldoRealizado: round2(receitasRealizadas - despesasRealizadas),
  };
}
