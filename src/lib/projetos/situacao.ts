import type { ProjetoStatus } from "@prisma/client";

export const PROJETO_STATUS: { value: ProjetoStatus; label: string }[] = [
  { value: "SEM_STATUS", label: "Sem status" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

export const STATUS_LABEL: Record<ProjetoStatus, string> = {
  SEM_STATUS: "Sem status",
  EM_ANDAMENTO: "Em andamento",
  PAUSADO: "Pausado",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export type SituacaoTone = "ok" | "atencao" | "atrasado" | "concluido" | "cancelado" | "neutro";

export type Situacao = { tone: SituacaoTone; label: string };

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Situação do projeto (define a cor do card). Considera status e prazo estimado.
 * `agora` é injetável para testes.
 */
export function situacaoProjeto(
  projeto: { status: ProjetoStatus; prazoEstimado: Date | string | null },
  agora: Date = new Date(),
): Situacao {
  if (projeto.status === "CONCLUIDO") return { tone: "concluido", label: "Concluído" };
  if (projeto.status === "CANCELADO") return { tone: "cancelado", label: "Cancelado" };

  if (!projeto.prazoEstimado) {
    return { tone: "neutro", label: STATUS_LABEL[projeto.status] };
  }

  const prazo = new Date(projeto.prazoEstimado);
  const diff = prazo.getTime() - agora.getTime();

  if (diff < 0) return { tone: "atrasado", label: "Atrasado" };
  if (diff <= 3 * DIA_MS) return { tone: "atencao", label: "Prazo próximo" };
  return { tone: "ok", label: "No prazo" };
}

/** Formata minutos como "HH:MM". */
export function formatHoras(min: number | null | undefined): string {
  const m = Math.max(0, Math.round(min ?? 0));
  const h = Math.floor(m / 60);
  const r = m % 60;
  return `${String(h).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
