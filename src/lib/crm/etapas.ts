/** Etapas do funil comercial. */
export const ETAPAS_LEAD: { key: string; label: string; cor: string }[] = [
  { key: "novo", label: "Novo", cor: "#94a3b8" },
  { key: "contato", label: "Em contato", cor: "#0ea5e9" },
  { key: "proposta", label: "Proposta enviada", cor: "#6366f1" },
  { key: "negociacao", label: "Negociação", cor: "#f59e0b" },
  { key: "ganho", label: "Ganho", cor: "#22c55e" },
  { key: "perdido", label: "Perdido", cor: "#ef4444" },
];

export const ETAPAS_ABERTAS = ["novo", "contato", "proposta", "negociacao"];

export function rotuloEtapa(k: string | null | undefined): string {
  return ETAPAS_LEAD.find((e) => e.key === k)?.label ?? "Novo";
}
export function corEtapa(k: string | null | undefined): string {
  return ETAPAS_LEAD.find((e) => e.key === k)?.cor ?? "#94a3b8";
}
