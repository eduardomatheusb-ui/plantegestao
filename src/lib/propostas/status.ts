import type { PropostaStatus } from "@prisma/client";

export const PROPOSTA_STATUS: { value: PropostaStatus; label: string }[] = [
  { value: "EM_ABERTO", label: "Em aberto" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REPROVADA", label: "Reprovada" },
  { value: "EXPIRADA", label: "Expirada" },
];

export const STATUS_LABEL: Record<PropostaStatus, string> = {
  EM_ABERTO: "Em aberto",
  ENVIADA: "Enviada",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  EXPIRADA: "Expirada",
};

export const STATUS_BADGE: Record<
  PropostaStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  EM_ABERTO: "warning",
  ENVIADA: "secondary",
  APROVADA: "success",
  REPROVADA: "destructive",
  EXPIRADA: "muted",
};
