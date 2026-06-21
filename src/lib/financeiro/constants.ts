import type { LancamentoTipo, LancamentoStatus } from "@prisma/client";

export const TIPO_LABEL: Record<LancamentoTipo, string> = {
  RECEITA: "Receita",
  DESPESA: "Despesa",
  TRANSFERENCIA: "Transferência",
};

export const STATUS_LABEL: Record<LancamentoStatus, string> = {
  EM_ABERTO: "Em aberto",
  QUITADO: "Quitado",
};

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function rotuloMes(ano: number, mes: number): string {
  return `${MESES[mes - 1]?.toUpperCase()} ${ano}`;
}
