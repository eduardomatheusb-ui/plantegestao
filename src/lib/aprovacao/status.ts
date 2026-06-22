/** Estados do fluxo de aprovação de peça (cliente). */
export const APROVACAO_STATUS = [
  { key: "rascunho", label: "Rascunho", cor: "#6b7280" },
  { key: "enviado", label: "Aguardando cliente", cor: "#d97706" },
  { key: "aprovado", label: "Aprovado", cor: "#059669" },
  { key: "ajustes", label: "Ajustes solicitados", cor: "#dc2626" },
] as const;

export type AprovacaoStatusKey = (typeof APROVACAO_STATUS)[number]["key"];

export function rotuloAprovacao(key: string): string {
  return APROVACAO_STATUS.find((s) => s.key === key)?.label ?? key;
}

export function corAprovacao(key: string): string {
  return APROVACAO_STATUS.find((s) => s.key === key)?.cor ?? "#6b7280";
}
