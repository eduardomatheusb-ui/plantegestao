import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2, CalendarClock, Copy, Instagram, Send } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { obterJob, listarStatus } from "@/lib/jobs/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { arquivarJob, excluirJob, duplicarJob } from "@/lib/jobs/actions";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { formatDate, cn } from "@/lib/utils";
import { formatHoras } from "@/lib/projetos/situacao";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { MoverStatus } from "@/components/jobs/mover-status";
import { TarefasPanel } from "@/components/jobs/tarefas-panel";
import { CommentsPanel } from "@/components/shared/comments-panel";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { TimesheetPanel } from "@/components/shared/timesheet-panel";
import { HistoryPanel } from "@/components/shared/history-panel";

export default async function JobDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const podeGerir = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const [job, statuses, usuarios] = await Promise.all([
    obterJob(id),
    listarStatus(),
    listarUsuariosAtivos(),
  ]);
  if (!job) notFound();

  const statusOpts = statuses.map((s) => ({ id: s.id, nome: s.nome }));
  const hoje = new Date().toISOString().slice(0, 10);
  const atrasado = !!job.prazo && !job.status.isConcluido && new Date(job.prazo).getTime() < Date.now();
  const ehPost = job.tipo === "POSTAGEM";
  const formatos = ehPost ? rotulosFormatos(job.formatos) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`#${job.numero} · ${job.titulo}`}
        descricao={job.cliente?.nome}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <MoverStatus
              jobId={job.id}
              statusId={job.statusId}
              statuses={statusOpts}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button asChild variant="outline" size="sm">
              <Link href={`/jobs/${job.id}/editar`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>
            <form action={duplicarJob.bind(null, job.id)}>
              <Button type="submit" variant="outline" size="sm">
                <Copy className="size-4" />
                Duplicar
              </Button>
            </form>
            {podeGerir && (
              <ConfirmButton
                action={arquivarJob.bind(null, job.id, !job.arquivado)}
                variant="outline"
                confirmVariant={job.arquivado ? "default" : "destructive"}
                triggerIcon={job.arquivado ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                triggerLabel={job.arquivado ? "Reativar" : "Arquivar"}
                titulo={job.arquivado ? "Reativar job?" : "Arquivar job?"}
                descricao={job.arquivado ? "O job volta às listas e à pauta." : "O job sai das listas, mas o histórico é mantido."}
                confirmarLabel={job.arquivado ? "Reativar" : "Arquivar"}
              />
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirJob.bind(null, job.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir job definitivamente?"
                descricao="Esta ação não pode ser desfeita e remove subtarefas, comentários, anexos e apontamentos."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      {job.arquivado && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Este job está <strong>arquivado</strong>.
        </p>
      )}

      {/* Resumo */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Projeto</p>
            <p className="text-sm font-medium">
              {job.projeto ? (
                <Link href={`/projetos/${job.projeto.id}`} className="hover:underline">
                  #{job.projeto.numero} {job.projeto.nome}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Responsável</p>
            <p className="text-sm font-medium">{job.responsavel?.nome ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ehPost ? "Prazo de criação" : "Prazo"}</p>
            <p className={cn("inline-flex items-center gap-1 text-sm font-medium", atrasado && "text-destructive")}>
              <CalendarClock className="size-4" />
              {formatDate(job.prazo)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tempo apontado</p>
            <p className="font-display text-sm font-semibold tabular-nums">{formatHoras(job.apontadoMin)}</p>
          </div>
        </CardContent>
      </Card>

      {ehPost && (
        <Card className="border-l-4 border-l-fuchsia-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="size-4 text-fuchsia-500" aria-hidden="true" /> Postagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vai ao ar</p>
                <p className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400">
                  <Send className="size-4" />{formatDate(job.prazoPostagem)}
                </p>
              </div>
              <div className="space-y-1 sm:col-span-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Envolvidos</p>
                <p className="text-sm font-medium">
                  {job.envolvidos.length ? job.envolvidos.map((e) => e.usuario.nome).join(", ") : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Formato(s)</p>
              {formatos.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {formatos.map((f) => (
                    <span key={f} className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">{f}</span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">—</p>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Legenda</p>
              {job.legenda ? (
                <p className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">{job.legenda}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem legenda.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Briefing</CardTitle>
            </CardHeader>
            <CardContent>
              {job.briefing ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{job.briefing}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem briefing.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <TarefasPanel jobId={job.id} usuarios={usuarios} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="comentarios">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="comentarios">Comentários</TabsTrigger>
                  <TabsTrigger value="anexos">Anexos</TabsTrigger>
                  <TabsTrigger value="tempo">Tempo</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="comentarios">
                  <CommentsPanel entidadeTipo="job" entidadeId={job.id} />
                </TabsContent>
                <TabsContent value="anexos">
                  <AttachmentsPanel entidadeTipo="job" entidadeId={job.id} />
                </TabsContent>
                <TabsContent value="tempo">
                  <TimesheetPanel entidadeTipo="job" entidadeId={job.id} hoje={hoje} />
                </TabsContent>
                <TabsContent value="historico">
                  <HistoryPanel entidadeTipo="job" entidadeId={job.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
