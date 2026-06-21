import type { ProducaoStatus } from "@prisma/client";

export const PRODUCAO_STATUS: { value: ProducaoStatus; label: string }[] = [
  { value: "EM_ABERTO", label: "Em aberto" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REPROVADA", label: "Reprovada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const STATUS_LABEL: Record<ProducaoStatus, string> = {
  EM_ABERTO: "Em aberto",
  ENVIADA: "Enviada",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  CANCELADA: "Cancelada",
};

export const STATUS_BADGE: Record<
  ProducaoStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  EM_ABERTO: "warning",
  ENVIADA: "secondary",
  APROVADA: "success",
  REPROVADA: "destructive",
  CANCELADA: "muted",
};
