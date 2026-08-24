"use client";

import * as React from "react";
import { CalendarRange } from "lucide-react";
import { moverPostagem, type MoverPostagemOpts } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

/**
 * Mover a postagem do post para outro mês/quadro (sem recriar o job).
 * Atalhos por mês ou uma data específica. A criação vai junto pelo mesmo
 * deslocamento, então o post inteiro muda de quadro.
 */
export function MoverPostagem({ jobId }: { jobId: string }) {
  const [novaData, setNovaData] = React.useState("");
  const [moverCriacao, setMoverCriacao] = React.useState(true);
  const [pendente, iniciar] = React.useTransition();

  function aplicar(opts: MoverPostagemOpts) {
    iniciar(async () => {
      try {
        await moverPostagem(jobId, { ...opts, moverCriacao });
      } catch (e) {
        if (!recarregarSeStale(e)) alert(e instanceof Error ? e.message : "Não foi possível mover a postagem.");
      }
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <CalendarRange className="size-3.5" /> Mover postagem de mês
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Button type="button" variant="outline" size="sm" disabled={pendente} onClick={() => aplicar({ mesesAdiante: 1 })}>
          Próximo mês
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={pendente} onClick={() => aplicar({ mesesAdiante: 2 })}>
          +2 meses
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="date"
          value={novaData}
          onChange={(e) => setNovaData(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          aria-label="Nova data de postagem"
        />
        <Button type="button" variant="outline" size="sm" disabled={pendente || !novaData} onClick={() => aplicar({ novaData })}>
          Definir nova data
        </Button>
      </div>
      <label className="flex items-center gap-1.5 pt-1 text-xs">
        <input type="checkbox" checked={moverCriacao} onChange={(e) => setMoverCriacao(e.target.checked)} className="size-3.5 rounded border-input" />
        Mover o prazo de criação junto (mesmo intervalo)
      </label>
    </div>
  );
}
