import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2, CalendarClock, Copy, Instagram, Send, Lock, LockOpen, CheckCircle2, RotateCcw, LayoutTemplate, AlarmClock } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { obterJob, listarStatus } from "@/lib/jobs/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { arquivarJob, excluirJob, duplicarJob, moverJobStatus } from "@/lib/jobs/actions";
import { criarTemplateDeJob } from "@/lib/templates/actions";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloTipoJob, tipoJobSocial } from "@/lib/jobs/tipos";
import { formatDate, cn } from "@/lib/utils";
import { formatHoras } from "@/lib/projetos/situacao";
import { BrandHero } from "@/components/shared/brand-hero";
import { ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { MoverStatus } from "@/components/jobs/mover-status";
import { TarefasPanel } from "@/components/jobs/tarefas-panel";
import { AdiarPrazo } from "@/components/jobs/adiar-prazo";
import { CommentsPanel } from "@/components/shared/comments-panel";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { TimesheetPanel } from "@/components/shared/timesheet-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { AprovacaoPanel } from "@/components/aprovacao/aprovacao-panel";
import { PublicadaToggle } from "@/components/jobs/publicada-toggle";
import { baseUrl } from "@/lib/email";
import { IaAssist } from "@/components/ia/ia-assist";
import { gerarBriefingIA } from "@/lib/ia/actions";

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
  const statusConcluido = statuses.find((s) => s.isConcluido);
  const primeiroAberto = statuses.find((s) => !s.isConcluido);
  const hoje = new Date().toISOString().slice(0, 10);
  const atrasado = !!job.prazo && !job.status.isConcluido && new Date(job.prazo).getTime() < Date.now();
  const ehSocial = tipoJobSocial(job.tipo);
  const formatos = ehSocial ? rotulosFormatos(job.formatos) : [];

  return (
    <div className="space-y-6">
      <BrandHero
        titulo={job.titulo}
        subtitulo={`#${job.numero} · ${rotuloTipoJob(job.tipo)} · ${job.cliente?.nome ?? ""}`}
        icon={ListChecks}
        statusLabel={job.status.nome}
        statusCor={job.status.cor ?? undefined}
        acoes={
          <>
            {statusConcluido && !job.status.isConcluido && (
              <form action={moverJobStatus.bind(null, job.id, statusConcluido.id)}>
                <Button type="submit" size="sm">
                  <CheckCircle2 className="size-4" />
                  Concluir
                </Button>
              </form>
            )}
            {job.status.isConcluido && primeiroAberto && (
              <form action={moverJobStatus.bind(null, job.id, primeiroAberto.id)}>
                <Button type="submit" variant="outline" size="sm">
                  <RotateCcw className="size-4" />
                  Reabrir
                </Button>
              </form>
            )}
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
            <form action={criarTemplateDeJob.bind(null, job.id)}>
              <Button type="submit" variant="outline" size="sm" title="Criar um template reutilizável a partir deste job">
                <LayoutTemplate className="size-4" />
                Salvar como template
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
          </>
        }
      />

      {job.concluidoForaPrazo && (
        <p className="flex items-center gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300">
          <AlarmClock className="size-4 shrink-0" aria-hidden="true" />
          Concluído <strong>fora do prazo</strong>{job.concluidoEm ? ` em ${formatDate(job.concluidoEm)}` : ""}. Marca automática, registrada na conclusão.
        </p>
      )}

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
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{ehSocial ? "Prazo de criação" : "Prazo"}</p>
            <p className={cn("inline-flex items-center gap-1 text-sm font-medium", atrasado && "text-destructive")}>
              <CalendarClock className="size-4" />
              {formatDate(job.prazo)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tempo apontado</p>
            <p className="font-display text-sm font-semibold tabular-nums">{formatHoras(job.apontadoMin)}</p>
          </div>
          <div className="col-span-2 sm:col-span-4">
            <AdiarPrazo jobId={job.id} />
          </div>
        </CardContent>
      </Card>

      {ehSocial && (
        <Card className="border-l-4 border-l-fuchsia-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Instagram className="size-4 text-fuchsia-500" aria-hidden="true" /> {rotuloTipoJob(job.tipo)}
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

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3">
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Publicação</p>
                <p className="text-sm font-medium">
                  {job.publicadoEm ? `Publicada em ${formatDate(job.publicadoEm)}` : "Ainda não publicada"}
                  {job.remarcacoesPostagem > 0 && <span className="text-muted-foreground"> · {job.remarcacoesPostagem} remarcação(ões)</span>}
                </p>
              </div>
              <PublicadaToggle jobId={job.id} publicado={!!job.publicadoEm} linkPublicado={job.linkPublicado} />
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
            <CardContent className="space-y-4">
              {job.briefing ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{job.briefing}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem briefing.</p>
              )}
              <div className="border-t border-border pt-3">
                <IaAssist acao={gerarBriefingIA.bind(null, job.id)} rotulo="Gerar briefing com IA" />
              </div>
            </CardContent>
          </Card>

          {(job.bloqueadoPor || job.bloqueia.length > 0) && (
            <Card>
              <CardHeader><CardTitle>Dependências</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {job.bloqueadoPor && (
                  <p className="flex items-center gap-2">
                    {job.bloqueadoPor.concluidoEm ? <LockOpen className="size-4 text-emerald-600" aria-hidden="true" /> : <Lock className="size-4 text-amber-600" aria-hidden="true" />}
                    <span>
                      {job.bloqueadoPor.concluidoEm ? "Liberado — dependia de" : "Aguardando"}{" "}
                      <Link href={`/jobs/${job.bloqueadoPor.id}`} className="font-medium hover:underline">#{job.bloqueadoPor.numero} {job.bloqueadoPor.titulo}</Link>
                    </span>
                  </p>
                )}
                {job.bloqueia.length > 0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Bloqueia</p>
                    <ul className="mt-1 space-y-1">
                      {job.bloqueia.map((b) => (
                        <li key={b.id}><Link href={`/jobs/${b.id}`} className="hover:underline">#{b.numero} {b.titulo}</Link></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Aprovação do cliente</CardTitle></CardHeader>
            <CardContent>
              <AprovacaoPanel
                jobId={job.id}
                status={job.aprovacaoStatus}
                token={job.aprovacaoToken}
                link={job.aprovacaoToken ? `${baseUrl()}/aprovar/${job.aprovacaoToken}` : null}
                emailCliente={null}
                eventos={job.aprovacaoEventos}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Subtarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <TarefasPanel jobId={job.id} usuarios={usuarios} workflowAtivo={job.workflowAtivo} />
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
