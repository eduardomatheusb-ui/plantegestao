import type { SituacaoTone } from "./situacao";

/** Mapeia o tom da situação para classes de borda do card e variante de badge. */
export const TONE_BORDER: Record<SituacaoTone, string> = {
  atrasado: "border-l-destructive",
  atencao: "border-l-warning",
  ok: "border-l-success",
  concluido: "border-l-success",
  cancelado: "border-l-muted-foreground",
  neutro: "border-l-border",
};

export const TONE_BADGE: Record<
  SituacaoTone,
  "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "muted"
> = {
  atrasado: "destructive",
  atencao: "warning",
  ok: "success",
  concluido: "success",
  cancelado: "muted",
  neutro: "outline",
};
