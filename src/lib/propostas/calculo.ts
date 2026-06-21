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

export type ItemCalculo = {
  valorUnit: number;
  quantidade: number;
  desconto: number;
  visivel: boolean;
};

/** Total geral = soma dos subtotais apenas dos itens VISÍVEIS. */
export function calcularTotal(itens: ItemCalculo[]): number {
  const soma = itens
    .filter((i) => i.visivel)
    .reduce((acc, i) => acc + calcularSubtotal(i.valorUnit, i.quantidade, i.desconto), 0);
  return round2(soma);
}
