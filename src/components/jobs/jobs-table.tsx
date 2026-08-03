"use client";

import * as React from "react";
import Link from "next/link";
import { AlarmClock, Send, GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoverStatus } from "./mover-status";
import { MinhaParte } from "./minha-parte";
import { reordenarMinhaPauta } from "@/lib/jobs/actions";
import { iniciais } from "@/lib/format";
import { rotuloTipoJob, corTipoJob } from "@/lib/jobs/tipos";
import { formatDate, cn } from "@/lib/utils";
import type { JobListItem } from "@/lib/jobs/queries";

export function JobsTable({
  jobs,
  statuses,
  minhaParteDe,
  reordenavel = false,
}: {
  jobs: JobListItem[];
  statuses: { id: string; nome: string }[];
  /** id do usuário: na pauta, mostra "Concluí minha parte" nos jobs que são dele. */
  minhaParteDe?: string;
  /** Minha Pauta: permite arrastar as linhas para ordenar à mão (por pessoa). */
  reordenavel?: boolean;
}) {
  // Ordem local (otimista); ressincroniza quando o servidor manda a lista nova.
  const [ordem, setOrdem] = React.useState(jobs);
  React.useEffect(() => setOrdem(jobs), [jobs]);
  const [arrastando, setArrastando] = React.useState<string | null>(null);
  const [sobre, setSobre] = React.useState<string | null>(null);
  const [, iniciar] = React.useTransition();

  // Mostra "Concluí" onde ele de fato limpa o job: a pessoa tem parte (responsável
  // ou corresponsável) e o job não é workflow em sequência (nesses, a etapa se
  // conclui no checklist). Fora do workflow, "minha parte" fecha as tarefas dela.
  const podeConcluirParte = (job: JobListItem) =>
    !!minhaParteDe &&
    !job.workflowAtivo &&
    (job.responsavelId === minhaParteDe || job.envolvidos.some((e) => e.usuarioId === minhaParteDe));

  function soltarEm(alvoId: string) {
    const arrastadoId = arrastando;
    setArrastando(null);
    setSobre(null);
    if (!arrastadoId || arrastadoId === alvoId) return;

    const atual = [...ordem];
    const de = atual.findIndex((j) => j.id === arrastadoId);
    const para = atual.findIndex((j) => j.id === alvoId);
    if (de < 0 || para < 0) return;
    const [movido] = atual.splice(de, 1);
    // Insere ANTES do alvo (posição do alvo depois da remoção).
    const insercao = atual.findIndex((j) => j.id === alvoId);
    atual.splice(insercao, 0, movido);

    setOrdem(atual);
    iniciar(() => {
      void reordenarMinhaPauta(atual.map((j) => j.id));
    });
  }

  const lista = reordenavel ? ordem : jobs;

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            {reordenavel && <TableHead className="w-8" />}
            <TableHead className="w-14">#</TableHead>
            <TableHead>Título</TableHead>
            <TableHead>Cliente / Projeto</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead className="w-48">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lista.map((job) => {
            const atrasado =
              !!job.prazo && !job.status.isConcluido && new Date(job.prazo).getTime() < Date.now();
            return (
              <TableRow
                key={job.id}
                draggable={reordenavel}
                onDragStart={reordenavel ? (e) => { e.dataTransfer.effectAllowed = "move"; setArrastando(job.id); } : undefined}
                onDragOver={reordenavel ? (e) => { e.preventDefault(); setSobre(job.id); } : undefined}
                onDragLeave={reordenavel ? () => setSobre((s) => (s === job.id ? null : s)) : undefined}
                onDrop={reordenavel ? () => soltarEm(job.id) : undefined}
                onDragEnd={reordenavel ? () => { setArrastando(null); setSobre(null); } : undefined}
                className={cn(
                  reordenavel && "cursor-grab active:cursor-grabbing",
                  arrastando === job.id && "opacity-40",
                  reordenavel && sobre === job.id && arrastando && arrastando !== job.id && "border-t-2 border-t-brand-yellow",
                )}
              >
                {reordenavel && (
                  <TableCell className="text-muted-foreground/40">
                    <GripVertical className="size-4" aria-hidden="true" />
                  </TableCell>
                )}
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
                  <div className="flex items-center gap-1">
                    <MoverStatus jobId={job.id} statusId={job.statusId} statuses={statuses} />
                    {podeConcluirParte(job) && <MinhaParte jobId={job.id} concluida={false} compacta />}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
