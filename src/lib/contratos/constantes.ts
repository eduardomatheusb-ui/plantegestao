export const CONTRATO_STATUS = [
  { key: "ativo", label: "Ativo", cor: "#059669" },
  { key: "suspenso", label: "Suspenso", cor: "#d97706" },
  { key: "encerrado", label: "Encerrado", cor: "#6b7280" },
] as const;

export function rotuloContratoStatus(k: string) {
  return CONTRATO_STATUS.find((s) => s.key === k)?.label ?? k;
}
export function corContratoStatus(k: string) {
  return CONTRATO_STATUS.find((s) => s.key === k)?.cor ?? "#6b7280";
}
