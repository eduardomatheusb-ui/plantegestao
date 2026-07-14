export const FEEDBACK_TIPOS = [
  { key: "erro", label: "Erro / bug", cor: "#ef4444" },
  { key: "duvida", label: "Dúvida", cor: "#0ea5e9" },
  { key: "sugestao", label: "Sugestão", cor: "#22c55e" },
] as const;

export const FEEDBACK_STATUS = [
  { key: "aberto", label: "Aberto", cor: "#f59e0b" },
  { key: "em_analise", label: "Em análise", cor: "#6366f1" },
  { key: "resolvido", label: "Resolvido", cor: "#22c55e" },
] as const;

export const TIPO_KEYS: string[] = FEEDBACK_TIPOS.map((t) => t.key);
export const STATUS_KEYS: string[] = FEEDBACK_STATUS.map((s) => s.key);

export const rotuloTipo = (k: string) => FEEDBACK_TIPOS.find((t) => t.key === k)?.label ?? k;
export const corTipo = (k: string) => FEEDBACK_TIPOS.find((t) => t.key === k)?.cor ?? "#94a3b8";
export const rotuloStatus = (k: string) => FEEDBACK_STATUS.find((s) => s.key === k)?.label ?? k;
export const corStatus = (k: string) => FEEDBACK_STATUS.find((s) => s.key === k)?.cor ?? "#94a3b8";
