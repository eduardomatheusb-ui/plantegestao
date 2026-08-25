import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina classes condicionais e resolve conflitos do Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata um número como moeda brasileira (R$). */
export function formatBRL(valor: number | string): string {
  const n = typeof valor === "string" ? Number(valor) : valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(n) ? n : 0);
}

/** Fuso de exibição da agência (para horários). */
export const FUSO_EXIBICAO = "America/Sao_Paulo";

/**
 * Formata uma data "só dia" (dd/mm/aaaa).
 *
 * Renderiza em UTC de propósito: prazos, vencimentos e datas de postagem são
 * guardados em meia-noite UTC. Sem fixar o fuso, o servidor (Netlify, UTC) e o
 * navegador (Brasília, UTC-3) mostravam dias diferentes, e a data aparecia um
 * dia antes no navegador. Em UTC, o dia guardado é o dia exibido, igual nos dois.
 */
export function formatDate(data: Date | string | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeZone: "UTC" }).format(d);
}

/** Formata só a hora (HH:mm) de um instante, no fuso da agência. */
export function formatHora(data: Date | string | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short", timeZone: FUSO_EXIBICAO }).format(d);
}

/**
 * Formata data e hora de um INSTANTE (ex.: criado em, publicado em), no fuso da
 * agência. Use para timestamps; para datas "só dia" use formatDate.
 */
export function formatDataHora(data: Date | string | null | undefined): string {
  if (!data) return "—";
  const d = typeof data === "string" ? new Date(data) : data;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: FUSO_EXIBICAO }).format(d);
}
