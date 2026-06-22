/** Prioridade do job + detecção de "tarefa parada". */
export const PRIORIDADES: { key: string; label: string }[] = [
  { key: "baixa", label: "Baixa" },
  { key: "normal", label: "Normal" },
  { key: "alta", label: "Alta" },
  { key: "urgente", label: "Urgente" },
];

export function rotuloPrioridade(k: string | null | undefined): string {
  return PRIORIDADES.find((p) => p.key === k)?.label ?? "Normal";
}

/** alta/urgente merecem destaque visual. */
export function prioridadeDestaque(k: string | null | undefined): "urgente" | "alta" | null {
  if (k === "urgente") return "urgente";
  if (k === "alta") return "alta";
  return null;
}

const DIAS_PARADO = 7;

/** Job sem mexer há >= DIAS_PARADO dias e ainda não concluído = parado. */
export function diasParado(atualizadoEm: Date | string, isConcluido: boolean): number {
  if (isConcluido) return 0;
  const d = Math.floor((Date.now() - new Date(atualizadoEm).getTime()) / 86400000);
  return d >= DIAS_PARADO ? d : 0;
}
