import Link from "next/link";
import { CalendarClock, ListTodo } from "lucide-react";
import { MoverStatus } from "./mover-status";
import { iniciais } from "@/lib/format";
import { formatDate, cn } from "@/lib/utils";
import type { JobListItem } from "@/lib/jobs/queries";

export function JobCard({
  job,
  statuses,
  mostrarMover = true,
}: {
  job: JobListItem;
  statuses: { id: string; nome: string }[];
  mostrarMover?: boolean;
}) {
  const atrasado =
    !!job.prazo && !job.status.isConcluido && new Date(job.prazo).getTime() < Date.now();

  return (
    <div className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1 hover:underline">
          <p className="text-[11px] font-medium text-muted-foreground tabular-nums">#{job.numero}</p>
          <p className="text-sm font-medium leading-tight">{job.titulo}</p>
        </Link>
        {job.responsavel && (
          <span
            className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold"
            title={`Responsável: ${job.responsavel.nome}`}
          >
            {iniciais(job.responsavel.nome)}
          </span>
        )}
      </div>

      <p className="truncate text-xs text-muted-foreground">
        {job.cliente?.nomeFantasia || job.cliente?.nome}
        {job.projeto && <> · #{job.projeto.numero}</>}
      </p>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {job.prazo && (
          <span className={cn("inline-flex items-center gap-1", atrasado && "font-medium text-destructive")}>
            <CalendarClock className="size-3.5" />
            {formatDate(job.prazo)}
          </span>
        )}
        {job._count.tarefas > 0 && (
          <span className="inline-flex items-center gap-1" title="Subtarefas">
            <ListTodo className="size-3.5" />
            {job._count.tarefas}
          </span>
        )}
      </div>

      {mostrarMover && <MoverStatus jobId={job.id} statusId={job.statusId} statuses={statuses} className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />}
    </div>
  );
}
