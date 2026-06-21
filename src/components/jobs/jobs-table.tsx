import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoverStatus } from "./mover-status";
import { iniciais } from "@/lib/format";
import { rotuloTipoJob, tipoJobSocial } from "@/lib/jobs/tipos";
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
                  <span className={cn(
                    "ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold align-middle",
                    tipoJobSocial(job.tipo) ? "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300" : "bg-muted text-muted-foreground",
                  )}>
                    {rotuloTipoJob(job.tipo)}
                  </span>
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
                <TableCell className={cn("text-sm", atrasado && "font-medium text-destructive")}>
                  {formatDate(job.prazo)}
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
