"use client";

import { useTransition } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { concluirMinhaParte, reabrirMinhaParte } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

/**
 * Corresponsável marca que a parte dele acabou → o job sai da pauta dele
 * (mas continua vivo com os outros).
 */
export function MinhaParte({ jobId, concluida }: { jobId: string; concluida: boolean }) {
  const [pendente, iniciar] = useTransition();

  const acionar = (fn: (id: string) => Promise<void>) =>
    iniciar(async () => {
      try {
        await fn(jobId);
      } catch (e) {
        recarregarSeStale(e);
      }
    });

  if (concluida) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm">
        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        <span className="font-medium text-emerald-700 dark:text-emerald-300">Minha parte está concluída</span>
        <span className="text-xs text-muted-foreground">— saiu da sua pauta</span>
        <Button type="button" variant="ghost" size="sm" className="ml-auto" disabled={pendente} onClick={() => acionar(reabrirMinhaParte)}>
          <RotateCcw className="size-3.5" /> {pendente ? "…" : "Reabrir"}
        </Button>
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={pendente} onClick={() => acionar(concluirMinhaParte)}>
      <CheckCircle2 className="size-4" /> {pendente ? "Salvando…" : "Concluí minha parte"}
    </Button>
  );
}
