"use client";

import * as React from "react";
import { definirPrazoTarefa } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { cn } from "@/lib/utils";

/** Prazo próprio da etapa: input de data compacto que salva ao alterar. */
export function TarefaPrazo({ id, prazo, atrasada }: { id: string; prazo: string; atrasada?: boolean }) {
  const [valor, setValor] = React.useState(prazo);
  const [pendente, iniciar] = React.useTransition();

  function salvar(v: string) {
    setValor(v);
    iniciar(async () => {
      try {
        await definirPrazoTarefa(id, v);
      } catch (e) {
        recarregarSeStale(e);
      }
    });
  }

  return (
    <input
      type="date"
      value={valor}
      onChange={(e) => salvar(e.target.value)}
      disabled={pendente}
      title="Prazo da etapa"
      className={cn(
        "h-7 w-[7.5rem] shrink-0 rounded-md border border-input bg-background px-1.5 text-xs",
        !valor && "text-muted-foreground",
        atrasada && "border-destructive/50 text-destructive",
      )}
    />
  );
}
