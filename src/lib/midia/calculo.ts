export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Total de inserções de uma linha (soma das quantidades dia a dia). */
export function totalInsercoes(quantidades: number[]): number {
  return quantidades.reduce((acc, q) => acc + (q || 0), 0);
}

export type LinhaCalculo = {
  totalInsercoes: number;
  valorInsercao: number;
};

export type TotaisMidia = {
  totalMidia: number; // Σ inserções × valor da inserção
  comissao: number; // totalMidia × comissão%
  valorTotal: number; // totalMidia + honorários (o que o cliente paga)
};

/**
 * Totais do plano de mídia.
 * Modelo: agência recebe do cliente (Total da Mídia + honorários) e repassa ao
 * veículo. A comissão é a parte da agência embutida no Total da Mídia.
 */
export function calcularTotaisMidia(
  linhas: LinhaCalculo[],
  comissaoPct: number,
  honorarios: number,
): TotaisMidia {
  const totalMidia = round2(
    linhas.reduce((acc, l) => acc + l.totalInsercoes * (l.valorInsercao || 0), 0),
  );
  const comissao = round2(totalMidia * ((comissaoPct || 0) / 100));
  const valorTotal = round2(totalMidia + (honorarios || 0));
  return { totalMidia, comissao, valorTotal };
}
