import type { ReembolsoStatus } from "@prisma/client";

/** Valor acima do qual a despesa exige justificativa/autorização prévia. */
export const LIMITE_AUTORIZACAO = 150;

export const STATUS_LABEL: Record<ReembolsoStatus, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado para análise",
  PENDENTE_AJUSTE: "Pendente de ajuste",
  APROVADO: "Aprovado",
  REPROVADO: "Reprovado",
  PROGRAMADO: "Programado para pagamento",
  PAGO: "Pago",
};

/** Cor do badge por status (variantes do componente Badge). */
export const STATUS_VARIANT: Record<ReembolsoStatus, "default" | "secondary" | "success" | "warning" | "destructive" | "outline"> = {
  RASCUNHO: "outline",
  ENVIADO: "secondary",
  PENDENTE_AJUSTE: "warning",
  APROVADO: "success",
  REPROVADO: "destructive",
  PROGRAMADO: "default",
  PAGO: "success",
};

/** Categorias de despesa reembolsável. */
export const CATEGORIAS: { key: string; label: string }[] = [
  { key: "alimentacao", label: "Alimentação" },
  { key: "transporte_app", label: "Transporte por aplicativo" },
  { key: "combustivel", label: "Combustível" },
  { key: "estacionamento", label: "Estacionamento" },
  { key: "pedagio", label: "Pedágio" },
  { key: "hospedagem", label: "Hospedagem" },
  { key: "material", label: "Material emergencial" },
  { key: "compra_autorizada", label: "Compra autorizada" },
  { key: "deslocamento", label: "Deslocamento para captação" },
  { key: "viagem", label: "Despesa de viagem" },
  { key: "outros", label: "Outros" },
];

export const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(CATEGORIAS.map((c) => [c.key, c.label]));

/** Forma de pagamento usada pelo colaborador na despesa. */
export const FORMAS_PAGAMENTO: { key: string; label: string }[] = [
  { key: "pix", label: "Pix" },
  { key: "dinheiro", label: "Dinheiro" },
  { key: "cartao_proprio", label: "Cartão próprio" },
  { key: "cartao_empresa", label: "Cartão da empresa" },
  { key: "outro", label: "Outro" },
];

export const FORMA_PAGAMENTO_LABEL: Record<string, string> = Object.fromEntries(FORMAS_PAGAMENTO.map((f) => [f.key, f.label]));

export const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function rotuloCompetencia(ano: number, mes: number): string {
  return `${MESES[mes - 1] ?? ""}/${ano}`;
}

/**
 * Data prevista de pagamento conforme a política: pedidos aprovados até dia 30
 * são pagos até dia 20 do mês seguinte à competência.
 */
export function dataPrevistaPagamento(ano: number, mes: number): Date {
  // mês seguinte à competência (mes é 1..12) → dia 20
  return new Date(ano, mes, 20);
}

/** Último dia do mês de competência (para a data de competência do lançamento). */
export function fimDaCompetencia(ano: number, mes: number): Date {
  return new Date(ano, mes, 0);
}
