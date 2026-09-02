/** Arredonda para 2 casas decimais (evitando erros de ponto flutuante). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Subtotal de um item: (valor unitário × quantidade) − desconto.
 * O desconto é um valor em R$. Nunca retorna negativo.
 */
export function calcularSubtotal(
  valorUnit: number,
  quantidade: number,
  desconto: number,
): number {
  const bruto = (valorUnit || 0) * (quantidade || 0);
  const liquido = bruto - (desconto || 0);
  return round2(Math.max(0, liquido));
}

export type Recorrencia = "UNICA" | "MENSAL";

export type ItemCalculo = {
  valorUnit: number;
  quantidade: number;
  desconto: number;
  visivel: boolean;
  recorrencia?: Recorrencia | string | null;
};

/**
 * Totais separados por recorrência (só itens VISÍVEIS):
 * - unico: pagamento único (itens não recorrentes)
 * - mensal: recorrente por mês (itens marcados como MENSAL)
 */
export function calcularTotais(itens: ItemCalculo[]): { unico: number; mensal: number } {
  let unico = 0;
  let mensal = 0;
  for (const i of itens.filter((x) => x.visivel)) {
    const sub = calcularSubtotal(i.valorUnit, i.quantidade, i.desconto);
    if (i.recorrencia === "MENSAL") mensal += sub;
    else unico += sub;
  }
  return { unico: round2(unico), mensal: round2(mensal) };
}
