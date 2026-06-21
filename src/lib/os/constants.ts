import type { OsStatus } from "@prisma/client";

export const OS_STATUS: { value: OsStatus; label: string }[] = [
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "EMITIDA", label: "Emitida" },
  { value: "PAGA", label: "Paga" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const STATUS_LABEL: Record<OsStatus, string> = {
  RASCUNHO: "Rascunho",
  EMITIDA: "Emitida",
  PAGA: "Paga",
  CANCELADA: "Cancelada",
};

export const STATUS_BADGE: Record<
  OsStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  RASCUNHO: "muted",
  EMITIDA: "warning",
  PAGA: "success",
  CANCELADA: "destructive",
};
