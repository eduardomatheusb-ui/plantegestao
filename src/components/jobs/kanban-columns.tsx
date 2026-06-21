"use client";

import * as React from "react";
import { GripVertical } from "lucide-react";
import { JobCard } from "./job-card";
import { moverJobStatus } from "@/lib/jobs/actions";
import { cn } from "@/lib/utils";
import type { JobListItem } from "@/lib/jobs/queries";

export type KanbanColuna = {
  id: string;
  titulo: string;
  cor?: string | null;
  jobs: JobListItem[];
};

/**
 * Quadro kanban genérico (colunas por status OU por responsável).
 * Quando `arrastavel` é true (visão por status), os cards podem ser arrastados
 * de uma coluna para outra para mudar o status — com atualização otimista.
 * O <select> "Mover" continua em cada card como alternativa por teclado.
 */
export function KanbanColumns({
  colunas,
  statuses,
  arrastavel = false,
}: {
  colunas: KanbanColuna[];
  statuses: { id: string; nome: string }[];
  arrastavel?: boolean;
}) {
  // Estado local para mover o card na hora (otimista); ressincroniza quando o
  // servidor revalida e manda novas colunas.
  const [cols, setCols] = React.useState(colunas);
  React.useEffect(() => setCols(colunas), [colunas]);

  const [arrastando, setArrastando] = React.useState<string | null>(null);
  const [sobre, setSobre] = React.useState<string | null>(null);
  const [, startTransition] = React.useTransition();

  function soltarNaColuna(destinoId: string) {
    const jobId = arrastando;
    setArrastando(null);
    setSobre(null);
    if (!jobId) return;

    const origem = cols.find((c) => c.jobs.some((j) => j.id === jobId));
    if (!origem || origem.id === destinoId) return;
    const job = origem.jobs.find((j) => j.id === jobId)!;

    // Move otimista entre colunas
    setCols((prev) =>
      prev.map((c) => {
        if (c.id === origem.id) return { ...c, jobs: c.jobs.filter((j) => j.id !== jobId) };
        if (c.id === destinoId) return { ...c, jobs: [{ ...job, statusId: destinoId }, ...c.jobs] };
        return c;
      }),
    );
    startTransition(() => {
      void moverJobStatus(jobId, destinoId);
    });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {cols.map((col) => {
        const alvo = arrastavel && sobre === col.id && arrastando;
        return (
          <section
            key={col.id}
            onDragOver={arrastavel ? (e) => { e.preventDefault(); setSobre(col.id); } : undefined}
            onDragLeave={arrastavel ? () => setSobre((s) => (s === col.id ? null : s)) : undefined}
            onDrop={arrastavel ? () => soltarNaColuna(col.id) : undefined}
            className={cn(
              "flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 p-2 transition-colors",
              alvo && "bg-brand-yellow/15 ring-2 ring-brand-yellow",
            )}
          >
            <header className="flex items-center justify-between px-1 py-2">
              <span className="flex items-center gap-2 text-sm font-semibold">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: col.cor ?? "var(--muted-foreground)" }}
                  aria-hidden="true"
                />
                {col.titulo}
              </span>
              <span className="rounded-full bg-background px-2 text-xs font-medium text-muted-foreground tabular-nums">
                {col.jobs.length}
              </span>
            </header>
            <div className="flex-1 space-y-2">
              {col.jobs.length === 0 ? (
                <p className="px-1 py-3 text-xs text-muted-foreground">
                  {alvo ? "Solte aqui" : "Vazio"}
                </p>
              ) : (
                col.jobs.map((job) =>
                  arrastavel ? (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = "move";
                        setArrastando(job.id);
                      }}
                      onDragEnd={() => { setArrastando(null); setSobre(null); }}
                      className={cn(
                        "group relative cursor-grab active:cursor-grabbing",
                        arrastando === job.id && "opacity-40",
                      )}
                    >
                      <GripVertical
                        className="absolute right-1.5 top-1.5 size-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden="true"
                      />
                      <JobCard job={job} statuses={statuses} />
                    </div>
                  ) : (
                    <JobCard key={job.id} job={job} statuses={statuses} />
                  ),
                )
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
