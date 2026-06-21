import { JobCard } from "./job-card";
import type { JobListItem } from "@/lib/jobs/queries";

export type KanbanColuna = {
  id: string;
  titulo: string;
  cor?: string | null;
  jobs: JobListItem[];
};

/** Quadro kanban genérico (colunas por status OU por responsável). */
export function KanbanColumns({
  colunas,
  statuses,
}: {
  colunas: KanbanColuna[];
  statuses: { id: string; nome: string }[];
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {colunas.map((col) => (
        <section key={col.id} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 p-2">
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
              <p className="px-1 py-3 text-xs text-muted-foreground">Vazio</p>
            ) : (
              col.jobs.map((job) => <JobCard key={job.id} job={job} statuses={statuses} />)
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
