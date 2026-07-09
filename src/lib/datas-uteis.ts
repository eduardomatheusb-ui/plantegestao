/**
 * Cálculo de prazos com opção de "dias úteis" (pula sábados, domingos e
 * feriados cadastrados). Puro — recebe o conjunto de feriados já pronto.
 */

export function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ehDiaUtil(d: Date, feriados: Set<string>): boolean {
  const dow = d.getDay(); // 0 dom, 6 sáb
  return dow !== 0 && dow !== 6 && !feriados.has(chaveDia(d));
}

function proximoDiaUtil(d: Date, feriados: Set<string>): Date {
  const x = new Date(d);
  while (!ehDiaUtil(x, feriados)) x.setDate(x.getDate() + 1);
  return x;
}

/** Avança `n` dias úteis a partir de `d` (n pode ser 0). */
export function adicionarDiasUteis(d: Date, n: number, feriados: Set<string>): Date {
  const x = new Date(d);
  let restantes = n;
  while (restantes > 0) {
    x.setDate(x.getDate() + 1);
    if (ehDiaUtil(x, feriados)) restantes--;
  }
  return x;
}

export type UnidadeAdiar = "hora" | "dia" | "semana" | "mes";

/**
 * Adia `base` por (unidade × quantidade). Com `diasUteis`, os incrementos em
 * dias/semanas contam apenas dias úteis; hora/mês caem para o próximo dia útil
 * se aterrissarem em fim de semana ou feriado.
 */
export function adiar(
  base: Date,
  unidade: UnidadeAdiar,
  quantidade: number,
  opts: { diasUteis?: boolean; feriados?: Set<string> } = {},
): Date {
  const feriados = opts.feriados ?? new Set<string>();
  const diasUteis = !!opts.diasUteis;
  const r = new Date(base);

  if (unidade === "hora") {
    r.setHours(r.getHours() + quantidade);
    return diasUteis ? proximoDiaUtil(r, feriados) : r;
  }
  if (unidade === "dia") {
    return diasUteis ? adicionarDiasUteis(r, quantidade, feriados) : (r.setDate(r.getDate() + quantidade), r);
  }
  if (unidade === "semana") {
    return diasUteis ? adicionarDiasUteis(r, quantidade * 5, feriados) : (r.setDate(r.getDate() + quantidade * 7), r);
  }
  // mês
  r.setMonth(r.getMonth() + quantidade);
  return diasUteis ? proximoDiaUtil(r, feriados) : r;
}
