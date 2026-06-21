import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Archive, ArchiveRestore, Trash2, UserPlus, X, FolderTree, Copy } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { obterProjeto, listarUsuariosAtivos } from "@/lib/projetos/queries";
import { arquivarProjeto, excluirProjeto, adicionarEnvolvido, removerEnvolvido, duplicarProjeto } from "@/lib/projetos/actions";
import { situacaoProjeto, STATUS_LABEL, formatHoras } from "@/lib/projetos/situacao";
import { TONE_BADGE } from "@/lib/projetos/estilo";
import { formatBRL, formatDate } from "@/lib/utils";
import { iniciais } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { FavoritoButton } from "@/components/projetos/favorito-button";
import { StatusSelect } from "@/components/projetos/status-select";
import { AdicionarMenu } from "@/components/projetos/adicionar-menu";
import { CommentsPanel } from "@/components/shared/comments-panel";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { TimesheetPanel } from "@/components/shared/timesheet-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { InlineAction } from "@/components/shared/inline-action";

function Metrica({ rotulo, valor, nota }: { rotulo: string; valor: React.ReactNode; nota?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="font-display text-lg font-semibold tabular-nums">{valor}</p>
      {nota && <p className="text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

export default async function ProjetoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const projeto = await obterProjeto(id);
  if (!projeto) notFound();

  const situacao = situacaoProjeto(projeto);
  const hoje = new Date().toISOString().slice(0, 10);

  const envolvidosIds = new Set(projeto.envolvidos.map((e) => e.usuarioId));
  const usuarios = podeEditar ? await listarUsuariosAtivos() : [];
  const disponiveis = usuarios.filter((u) => !envolvidosIds.has(u.id));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`#${projeto.numero} · ${projeto.nome}`}
        descricao={projeto.cliente?.nome}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <FavoritoButton id={projeto.id} favorito={projeto.favorito} />
            <Badge variant={TONE_BADGE[situacao.tone]}>{situacao.label}</Badge>
            <StatusSelect id={projeto.id} status={projeto.status} disabled={!podeEditar} />
            {podeEditar && (
              <>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/projetos/${projeto.id}/editar`}>
                    <Pencil className="size-4" />
                    Editar
                  </Link>
                </Button>
                <form action={duplicarProjeto.bind(null, projeto.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    <Copy className="size-4" />
                    Duplicar
                  </Button>
                </form>
                <ConfirmButton
                  action={arquivarProjeto.bind(null, projeto.id, !projeto.arquivado)}
                  variant="outline"
                  confirmVariant={projeto.arquivado ? "default" : "destructive"}
                  triggerIcon={projeto.arquivado ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                  triggerLabel={projeto.arquivado ? "Reativar" : "Arquivar"}
                  titulo={projeto.arquivado ? "Reativar projeto?" : "Arquivar projeto?"}
                  descricao={projeto.arquivado ? "O projeto volta às listas." : "O projeto sai das listas, mas o histórico é mantido."}
                  confirmarLabel={projeto.arquivado ? "Reativar" : "Arquivar"}
                />
                <AdicionarMenu projetoId={projeto.id} />
              </>
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirProjeto.bind(null, projeto.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir projeto definitivamente?"
                descricao="Esta ação não pode ser desfeita e remove subprojetos, comentários, anexos e apontamentos vinculados."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      {projeto.arquivado && (
        <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Este projeto está <strong>arquivado</strong>.
        </p>
      )}

      {/* Barra de métricas */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <Metrica rotulo="Prazo desejado" valor={formatDate(projeto.prazoDesejado)} />
          <Metrica rotulo="Prazo estimado" valor={formatDate(projeto.prazoEstimado)} />
          <Metrica
            rotulo="Tempo"
            valor={formatHoras(projeto.apontadoMin)}
            nota={`de ${formatHoras(projeto.tempoEstimadoMin)} estimadas`}
          />
          <Metrica rotulo="Budget" valor={projeto.budget ? formatBRL(Number(projeto.budget)) : "—"} />
          <Metrica rotulo="Custo" valor={formatBRL(0)} nota="via despesas (em breve)" />
          <Metrica rotulo="Responsável" valor={projeto.responsavel?.nome ?? "—"} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Briefing</CardTitle>
            </CardHeader>
            <CardContent>
              {projeto.briefing ? (
                <p className="whitespace-pre-wrap text-sm text-foreground">{projeto.briefing}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Sem briefing.</p>
              )}
            </CardContent>
          </Card>

          {/* Envolvidos */}
          <Card>
            <CardHeader>
              <CardTitle>Envolvidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {projeto.envolvidos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém adicionado ainda.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {projeto.envolvidos.map((e) => (
                    <li key={e.usuarioId} className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                        {iniciais(e.usuario.nome)}
                      </span>
                      {e.usuario.nome}
                      {podeEditar && (
                        <InlineAction action={removerEnvolvido.bind(null, projeto.id, e.usuarioId)} title="Remover" className="p-0.5">
                          <X className="size-3.5" />
                        </InlineAction>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {podeEditar && disponiveis.length > 0 && (
                <form action={adicionarEnvolvido.bind(null, projeto.id)} className="flex items-center gap-2">
                  <label htmlFor="add-envolvido" className="sr-only">Adicionar envolvido</label>
                  <select id="add-envolvido" name="usuarioId" required className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Adicionar pessoa…</option>
                    {disponiveis.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                  </select>
                  <Button type="submit" size="sm" variant="outline">
                    <UserPlus className="size-4" />
                    Adicionar
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* Subprojetos */}
          {projeto.subprojetos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subprojetos ({projeto.subprojetos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {projeto.subprojetos.map((s) => (
                    <li key={s.id}>
                      <Link href={`/projetos/${s.id}`} className="flex items-center gap-3 py-2 text-sm hover:underline">
                        <FolderTree className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground tabular-nums">#{s.numero}</span>
                        <span className="font-medium">{s.nome}</span>
                        <Badge variant="outline" className="ml-auto">{STATUS_LABEL[s.status]}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Painel lateral em abas */}
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
                  <CommentsPanel entidadeTipo="projeto" entidadeId={projeto.id} />
                </TabsContent>
                <TabsContent value="anexos">
                  <AttachmentsPanel entidadeTipo="projeto" entidadeId={projeto.id} />
                </TabsContent>
                <TabsContent value="tempo">
                  <TimesheetPanel entidadeTipo="projeto" entidadeId={projeto.id} hoje={hoje} />
                </TabsContent>
                <TabsContent value="historico">
                  <HistoryPanel entidadeTipo="projeto" entidadeId={projeto.id} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
