import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatarValor, variacaoDe } from "@/lib/painel/formato";
import type { Indicador } from "@/lib/painel/queries";
import { cn } from "@/lib/utils";

export function IndicadorCard({ i }: { i: Indicador }) {
  const v = variacaoDe(i);
  const Icon = v ? (v.direcao === "up" ? ArrowUp : v.direcao === "down" ? ArrowDown : Minus) : null;

  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground" title={i.ajuda}>{i.label}</p>
      <p className="mt-1 font-display text-2xl font-bold tabular-nums">{formatarValor(i.valor, i.formato)}</p>
      {v && Icon ? (
        <p className={cn(
          "mt-1 inline-flex items-center gap-1 text-xs font-medium",
          v.direcao === "flat" ? "text-muted-foreground" : v.positivo ? "text-success" : "text-destructive",
        )}>
          <Icon className="size-3.5" aria-hidden="true" /> {v.texto}
          <span className="font-normal text-muted-foreground">vs. período anterior</span>
        </p>
      ) : i.valor == null ? (
        <p className="mt-1 text-xs text-muted-foreground">sem dados no período</p>
      ) : (
        <p className="mt-1 text-xs text-muted-foreground">estado atual</p>
      )}
    </div>
  );
}
