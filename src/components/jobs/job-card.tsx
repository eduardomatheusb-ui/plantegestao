import Link from "next/link";
import { CalendarClock, ListTodo, Send, Flame, PauseCircle, Repeat, Lock, CheckCircle2 } from "lucide-react";
import { MoverStatus } from "./mover-status";
import { iniciais } from "@/lib/format";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloTipoJob, tipoJobSocial } from "@/lib/jobs/tipos";
import { prioridadeDestaque, diasParado } from "@/lib/jobs/prioridade";
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
  const social = tipoJobSocial(job.tipo);
  const formatos = social ? rotulosFormatos(job.formatos) : [];
  const destaque = prioridadeDestaque(job.prioridade);
  const parado = diasParado(job.atualizadoEm, job.status.isConcluido);
  const concluido = job.status.isConcluido;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm",
        social && "border-l-4 border-l-fuchsia-400",
        concluido && "border-emerald-500/50 bg-emerald-50/70 ring-1 ring-emerald-500/30 dark:bg-emerald-950/20",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/jobs/${job.id}`} className="min-w-0 flex-1 hover:underline">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              social ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300" : "bg-muted text-muted-foreground",
            )}>
              {rotuloTipoJob(job.tipo)}
            </span>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">#{job.numero}</span>
            {concluido && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <CheckCircle2 className="size-3" aria-hidden="true" /> Concluído
              </span>
            )}
            {destaque && (
              <span className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                destaque === "urgente" ? "bg-destructive/15 text-destructive" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
              )}>
                <Flame className="size-3" aria-hidden="true" /> {destaque === "urgente" ? "Urgente" : "Alta"}
              </span>
            )}
          </span>
          <p className="mt-0.5 text-sm font-medium leading-tight">{job.titulo}</p>
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

      {formatos.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {formatos.map((f) => (
            <span key={f} className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{f}</span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {job.prazo && (
          <span className={cn("inline-flex items-center gap-1", atrasado && "font-medium text-destructive")} title={social ? "Prazo de criação" : "Prazo"}>
            <CalendarClock className="size-3.5" />
            {formatDate(job.prazo)}
          </span>
        )}
        {social && job.prazoPostagem && (
          <span className="inline-flex items-center gap-1 text-fuchsia-600 dark:text-fuchsia-400" title="Vai ao ar">
            <Send className="size-3.5" />
            {formatDate(job.prazoPostagem)}
          </span>
        )}
        {job._count.tarefas > 0 && (
          <span className="inline-flex items-center gap-1" title="Subtarefas">
            <ListTodo className="size-3.5" />
            {job._count.tarefas}
          </span>
        )}
        {parado > 0 && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400" title="Sem movimento">
            <PauseCircle className="size-3.5" /> parado {parado}d
          </span>
        )}
        {job.recorrenciaFreq && (
          <span className="inline-flex items-center gap-1" title={`Recorrente (${job.recorrenciaFreq})`}>
            <Repeat className="size-3.5" /> recorrente
          </span>
        )}
        {job.bloqueadoPor && !job.bloqueadoPor.concluidoEm && (
          <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400" title={`Aguarda o job #${job.bloqueadoPor.numero}: ${job.bloqueadoPor.titulo}`}>
            <Lock className="size-3.5" /> bloqueado por #{job.bloqueadoPor.numero}
          </span>
        )}
      </div>

      {mostrarMover && <MoverStatus jobId={job.id} statusId={job.statusId} statuses={statuses} className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8 sm:text-xs" />}
    </div>
  );
}
