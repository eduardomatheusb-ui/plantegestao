import Link from "next/link";
import { AlarmClock, Send } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoverStatus } from "./mover-status";
import { iniciais } from "@/lib/format";
import { rotuloTipoJob, corTipoJob } from "@/lib/jobs/tipos";
import { formatDate, cn } from "@/lib/utils";
import type { JobListItem } from "@/lib/jobs/queries";

export function JobsTable({
  jobs,
  statuses,
}: {
  jobs: JobListItem[];
  statuses: { id: string; nome: string }[];
}) {
  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">#</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Cliente / Projeto</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-48">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => {
            const atrasado =
              !!job.prazo && !job.status.isConcluido && new Date(job.prazo).getTime() < Date.now();
            return (
              <TableRow key={job.id}>
                <TableCell className="text-muted-foreground tabular-nums">#{job.numero}</TableCell>
                <TableCell className="font-medium">
                  <Link href={`/jobs/${job.id}`} className="hover:underline">{job.titulo}</Link>
                  <span
                    className="ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold align-middle"
                    style={{ backgroundColor: `${corTipoJob(job.tipo)}1f`, color: corTipoJob(job.tipo) }}
                  >
                    {rotuloTipoJob(job.tipo)}
                  </span>
                  {job.concluidoForaPrazo && (
                    <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 align-middle text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-300" title="Concluído depois do prazo (automático)">
                      <AlarmClock className="size-3" aria-hidden="true" /> Fora do prazo
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {job.cliente?.nome}
                  {job.projeto && <span className="block text-xs">#{job.projeto.numero} {job.projeto.nome}</span>}
                </TableCell>
                <TableCell>
                  {job.responsavel ? (
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                        {iniciais(job.responsavel.nome)}
                      </span>
                      {job.responsavel.nome}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <span className={cn(atrasado && "font-medium text-destructive")}>
                    {job.prazoPostagem && <span className="mr-1 text-[10px] uppercase tracking-wide text-muted-foreground">criação</span>}
                    {formatDate(job.prazo)}
                  </span>
                  {job.prazoPostagem && (
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-fuchsia-600 dark:text-fuchsia-400">
                      <Send className="size-3" /> <span className="text-[10px] uppercase tracking-wide opacity-80">no ar</span> {formatDate(job.prazoPostagem)}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <MoverStatus jobId={job.id} statusId={job.statusId} statuses={statuses} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
