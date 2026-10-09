/** Intervalo [início, fim) do mês "AAAA-MM" em UTC (datas só-dia ficam em meia-noite UTC). */
export function intervaloMes(mes: string): { gte: Date; lt: Date } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) return null;
  const ano = Number(m[1]);
  const idx = Number(m[2]) - 1;
  if (idx < 0 || idx > 11) return null;
  return { gte: new Date(Date.UTC(ano, idx, 1)), lt: new Date(Date.UTC(ano, idx + 1, 1)) };
}
