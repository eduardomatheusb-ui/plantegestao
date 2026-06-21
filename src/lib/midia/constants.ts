import type { MidiaStatus, VeiculoTipo } from "@prisma/client";

export const MIDIA_STATUS: { value: MidiaStatus; label: string }[] = [
  { value: "EM_ABERTO", label: "Em aberto" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "REPROVADA", label: "Reprovada" },
  { value: "CANCELADA", label: "Cancelada" },
];

export const STATUS_LABEL: Record<MidiaStatus, string> = {
  EM_ABERTO: "Em aberto",
  ENVIADA: "Enviada",
  APROVADA: "Aprovada",
  REPROVADA: "Reprovada",
  CANCELADA: "Cancelada",
};

export const STATUS_BADGE: Record<
  MidiaStatus,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  EM_ABERTO: "warning",
  ENVIADA: "secondary",
  APROVADA: "success",
  REPROVADA: "destructive",
  CANCELADA: "muted",
};

export const TIPO_LABEL: Record<VeiculoTipo, string> = {
  RADIO: "Rádio",
  TV: "TV",
  EXTERIOR: "Exterior / Outdoor",
  DIGITAL: "Digital",
  JORNAL: "Jornal",
  REVISTA: "Revista",
  OUTRO: "Outro",
};

/** Sigla curta para o badge da lista (RA, TV, EX...). */
export const TIPO_SIGLA: Record<VeiculoTipo, string> = {
  RADIO: "RA",
  TV: "TV",
  EXTERIOR: "EX",
  DIGITAL: "DG",
  JORNAL: "JO",
  REVISTA: "RV",
  OUTRO: "OU",
};

export const TIPOS_MIDIA: { value: VeiculoTipo; label: string }[] = [
  { value: "RADIO", label: "Rádio" },
  { value: "TV", label: "TV" },
  { value: "EXTERIOR", label: "Exterior / Outdoor" },
  { value: "DIGITAL", label: "Digital" },
  { value: "JORNAL", label: "Jornal" },
  { value: "REVISTA", label: "Revista" },
  { value: "OUTRO", label: "Outro" },
];

export function diasNoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}
