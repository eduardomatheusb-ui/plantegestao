export type TipoCompromisso = { key: string; label: string; cor: string };

/** Tipos de compromisso da agenda (com a cor usada no calendário). */
export const TIPOS_COMPROMISSO: TipoCompromisso[] = [
  { key: "reuniao", label: "Reunião", cor: "#6366f1" },
  { key: "gravacao", label: "Gravação", cor: "#ec4899" },
  { key: "visita", label: "Visita a cliente", cor: "#14b8a6" },
  { key: "prazo", label: "Prazo / entrega", cor: "#f59e0b" },
  { key: "financeiro", label: "Financeiro", cor: "#10b981" },
  { key: "outro", label: "Outro", cor: "#64748b" },
];

const MAPA = new Map(TIPOS_COMPROMISSO.map((t) => [t.key, t]));

export const TIPO_COMPROMISSO_PADRAO = "reuniao";

export function rotuloTipo(key: string | null | undefined): string {
  return (key && MAPA.get(key)?.label) || "Compromisso";
}
export function corTipo(key: string | null | undefined): string {
  return (key && MAPA.get(key)?.cor) || "#64748b";
}

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Opções de recorrência (a cada N dias). value "" = não se repete. */
export const OPCOES_RECORRENCIA: { value: string; label: string }[] = [
  { value: "", label: "Não se repete" },
  { value: "7", label: "A cada 7 dias (semanal)" },
  { value: "15", label: "A cada 15 dias (quinzenal)" },
  { value: "30", label: "A cada 30 dias (mensal)" },
];

export const RECORRENCIAS_VALIDAS = new Set([7, 15, 30]);

export function rotuloRecorrencia(dias: number | null | undefined): string | null {
  if (!dias) return null;
  return OPCOES_RECORRENCIA.find((o) => o.value === String(dias))?.label ?? `A cada ${dias} dias`;
}
