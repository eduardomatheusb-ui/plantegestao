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

/** Tipo de contrato: fee recorrente (MRR) x serviço pontual (validade própria). */
export const CONTRATO_TIPOS = [
  { key: "recorrente", label: "Recorrente (fee mensal)" },
  { key: "pontual", label: "Pontual (serviço fechado)" },
] as const;

export function rotuloContratoTipo(k: string) {
  return CONTRATO_TIPOS.find((t) => t.key === k)?.label ?? k;
}

/** Serviços comuns para contratos pontuais (o campo aceita texto livre também). */
export const CONTRATO_SERVICOS = [
  "Gestão de mídia",
  "Identidade visual",
  "Site / landing page",
  "Produção audiovisual",
  "Campanha / tráfego",
  "Consultoria / estratégia",
  "Outro",
] as const;
