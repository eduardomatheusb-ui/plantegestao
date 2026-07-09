"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { adiarPrazoJob, type AdiarOpts } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

const ATALHOS: { label: string; unidade: AdiarOpts["unidade"]; quantidade: number }[] = [
  { label: "+1h", unidade: "hora", quantidade: 1 },
  { label: "+1 dia", unidade: "dia", quantidade: 1 },
  { label: "+1 semana", unidade: "semana", quantidade: 1 },
  { label: "+1 mês", unidade: "mes", quantidade: 1 },
];

export function AdiarPrazo({ jobId }: { jobId: string }) {
  const [recalcular, setRecalcular] = React.useState(true);
  const [diasUteis, setDiasUteis] = React.useState(false);
  const [novaData, setNovaData] = React.useState("");
  const [pendente, iniciar] = React.useTransition();

  function aplicar(opts: AdiarOpts) {
    iniciar(async () => {
      try {
        await adiarPrazoJob(jobId, { ...opts, recalcular, diasUteis });
      } catch (e) {
        if (!recarregarSeStale(e)) alert(e instanceof Error ? e.message : "Não foi possível adiar.");
      }
    });
  }

  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Clock className="size-3.5" /> Adiar prazo
      </p>
      <div className="flex flex-wrap gap-1.5">
        {ATALHOS.map((a) => (
          <Button key={a.label} type="button" variant="outline" size="sm" disabled={pendente}
            onClick={() => aplicar({ unidade: a.unidade, quantidade: a.quantidade })}>
            {a.label}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <input
          type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        />
        <Button type="button" variant="outline" size="sm" disabled={pendente || !novaData}
          onClick={() => aplicar({ novaData })}>
          Definir data
        </Button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-xs">
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={recalcular} onChange={(e) => setRecalcular(e.target.checked)} className="size-3.5 rounded border-input" />
          Recalcular tarefas seguintes
        </label>
        <label className="flex items-center gap-1.5">
          <input type="checkbox" checked={diasUteis} onChange={(e) => setDiasUteis(e.target.checked)} className="size-3.5 rounded border-input" />
          Considerar dias úteis
        </label>
      </div>
    </div>
  );
}
