export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Total de inserções de uma linha (soma das quantidades dia a dia). */
export function totalInsercoes(quantidades: number[]): number {
  return quantidades.reduce((acc, q) => acc + (q || 0), 0);
}

/** Subtotal de uma linha: (inserções × valor unitário) − desconto. */
export function subtotalLinha(totalInsercoes: number, valorInsercao: number, desconto = 0): number {
  return round2(Math.max(0, totalInsercoes * (valorInsercao || 0) - (desconto || 0)));
}

export type LinhaCalculo = {
  totalInsercoes: number;
  valorInsercao: number;
  desconto?: number;
};

export type TotaisMidia = {
  totalMidia: number; // Σ subtotais das linhas
  comissao: number; // totalMidia × comissão%
  valorLiquido: number; // totalMidia − comissão (repasse ao veículo)
  valorTotal: number; // totalMidia + honorários (o que o cliente paga)
};

/**
 * Totais do plano de mídia.
 * Modelo: agência recebe do cliente (Total da Mídia + honorários) e repassa ao
 * veículo o líquido. A comissão é a remuneração da agência (% do Total da Mídia).
 */
export function calcularTotaisMidia(
  linhas: LinhaCalculo[],
  comissaoPct: number,
  honorarios: number,
): TotaisMidia {
  const totalMidia = round2(
    linhas.reduce((acc, l) => acc + subtotalLinha(l.totalInsercoes, l.valorInsercao, l.desconto), 0),
  );
  const comissao = round2(totalMidia * ((comissaoPct || 0) / 100));
  const valorLiquido = round2(totalMidia - comissao);
  const valorTotal = round2(totalMidia + (honorarios || 0));
  return { totalMidia, comissao, valorLiquido, valorTotal };
}
