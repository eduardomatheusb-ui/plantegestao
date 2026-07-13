import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil, Plus, ListChecks, FolderKanban, CalendarDays, Hourglass, Repeat, ExternalLink,
  FileText, NotebookPen, Layers, Paperclip, AlertTriangle, PenLine, Megaphone, CalendarClock,
  Users, History as HistoryIcon, BarChart3,
} from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterClienteVisao, estacaoResumo } from "@/lib/clientes/queries";
import { listarOnboarding } from "@/lib/onboarding/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { CLIENTE_STATUS } from "@/lib/cadastros/registry";
import { rotuloTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { baseUrl } from "@/lib/email";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandHero } from "@/components/shared/brand-hero";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { PortalPanel } from "@/components/portal/portal-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { EstacaoTabs, type AbaEstacao } from "@/components/clientes/estacao-tabs";
import { ResponsaveisConta } from "@/components/clientes/responsaveis-conta";
import { iniciais } from "@/lib/format";
import { formatBRL, formatDate, cn } from "@/lib/utils";

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "—";
}
function mesAno(d: Date) {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function statusInfo(s: string) {
  return CLIENTE_STATUS.find((o) => o.value === s);
}
const STATUS_COR: Record<string, string> = {
  ativo: "#34d399", implantacao: "#fbbf24", pausado: "#94a3b8", inadimplente: "#f87171", encerrado: "#9ca3af",
};

function Stat({ icon: Icon, rotulo, valor, destaque, alerta }: { icon: typeof ListChecks; rotulo: string; valor: React.ReactNode; destaque?: boolean; alerta?: boolean }) {
  return (
    <Card className={cn(destaque && "border-brand-yellow/60 bg-[#f7ff19]/10", alerta && "border-destructive/50 bg-destructive/5")}>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", destaque ? "bg-brand-yellow text-ink-900" : alerta ? "bg-destructive/15 text-destructive" : "bg-muted")}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className={cn("font-display text-xl font-bold leading-none tabular-nums", alerta && "text-destructive")}>{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Campo({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="whitespace-pre-wrap text-sm">{valor}</p>
    </div>
  );
}

function EmBreve({ texto }: { texto: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{texto}</p>
      </CardContent>
    </Card>
  );
}

export default async function ClienteEstacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const acesso = await requireModulo("cadastros", "VER");
  const podeFinanceiro = podeModulo(acesso.caps, "financeiro", "VER");
  const podeEditar = podeModulo(acesso.caps, "cadastros", "EDITAR");
  const { id } = await params;
  const { aba } = await searchParams;

  const dados = await obterClienteVisao(id);
  if (!dados) notFound();
  const { cliente: c, jobsAtivos, projetosAtivos, postagens, resumo } = dados;

  const [estacao, onboardingItens, usuarios] = await Promise.all([
    estacaoResumo(id),
    listarOnboarding(id),
    listarUsuariosAtivos(),
  ]);

  const st = statusInfo(c.status);
  const ck = estacao.cockpit;
  const contaDesde = estacao.contaDesde ?? c.criadoEm;

  // ── Conteúdo das abas ──────────────────────────────────────────────

  const abaVisaoGeral = (
    <>
      {/* Cockpit */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={ListChecks} rotulo="Demandas abertas" valor={ck.abertas} />
        <Stat icon={AlertTriangle} rotulo="Atrasadas" valor={ck.atrasadas} alerta={ck.atrasadas > 0} />
        <Stat icon={Hourglass} rotulo="Aguardando cliente" valor={ck.aguardandoCliente} destaque={ck.aguardandoCliente > 0} />
        <Stat icon={PenLine} rotulo="Ajustes solicitados" valor={ck.ajustes} />
        <Stat icon={CalendarDays} rotulo="Entregas da semana" valor={ck.entregasSemana} />
        <Stat icon={CalendarClock} rotulo="Conteúdos programados" valor={ck.programados} />
        <Stat icon={Megaphone} rotulo="Campanhas ativas" valor={ck.campanhasAtivas} />
        <Stat
          icon={CalendarDays}
          rotulo={estacao.proximaEntrega ? `Próxima entrega — ${estacao.proximaEntrega.titulo}` : "Próxima entrega"}
          valor={estacao.proximaEntrega ? dataBR(estacao.proximaEntrega.prazo) : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4" /> Jobs em andamento</CardTitle></CardHeader>
            <CardContent>
              {jobsAtivos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum job ativo.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {jobsAtivos.map((j) => (
                    <li key={j.id} className="py-2">
                      <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                        <span className="min-w-0"><span className="text-muted-foreground tabular-nums">#{j.numero}</span> {j.titulo}<span className="block text-xs text-muted-foreground">{rotuloTipoJob(j.tipo)}{j.prazo ? ` · ${dataBR(j.prazo)}` : ""}</span></span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${j.status.cor ?? "#9ca3af"}22`, color: j.status.cor ?? "#6b7280" }}>{j.status.nome}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="size-4" /> Próximas postagens</CardTitle></CardHeader>
            <CardContent>
              {postagens.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma postagem programada.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {postagens.map((p) => (
                    <li key={p.id} className="py-2">
                      <Link href={`/jobs/${p.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                        <span className="min-w-0">{p.titulo}<span className="block text-xs text-muted-foreground">{dataBR(p.prazoPostagem)}{rotulosFormatos(p.formatos).length ? ` · ${rotulosFormatos(p.formatos).join(", ")}` : ""}</span></span>
                        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${corAprovacao(p.aprovacaoStatus)}22`, color: corAprovacao(p.aprovacaoStatus) }}>{rotuloAprovacao(p.aprovacaoStatus)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {projetosAtivos.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FolderKanban className="size-4" /> Projetos</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {projetosAtivos.map((p) => (
                    <li key={p.id} className="py-2"><Link href={`/projetos/${p.id}`} className="text-sm hover:underline"><span className="text-muted-foreground tabular-nums">#{p.numero}</span> {p.nome}</Link></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" /> Equipe envolvida</CardTitle></CardHeader>
            <CardContent>
              {estacao.equipe.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ninguém alocado em jobs ativos.</p>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {estacao.equipe.map((u) => (
                    <li key={u.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs">
                      <span className="flex size-5 items-center justify-center rounded-full bg-brand-yellow text-[10px] font-bold text-ink-900">{iniciais(u.nome)}</span>
                      {u.nome}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ExternalLink className="size-4" /> Portal do cliente</CardTitle></CardHeader>
            <CardContent>
              <PortalPanel clienteId={id} link={(c.portalSlug || c.portalToken) ? `${baseUrl()}/portal/${c.portalSlug || c.portalToken}` : null} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding / implantação</CardTitle></CardHeader>
        <CardContent><OnboardingPanel clienteId={id} status={c.status} itens={onboardingItens} usuarios={usuarios} /></CardContent>
      </Card>
    </>
  );

  const abaDossie = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Brand kit & escopo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {(c.escopo || c.tomDeVoz || c.redesSociais || c.linksUteis) ? (
            <>
              <Campo rotulo="Escopo" valor={c.escopo} />
              <Campo rotulo="Tom de voz" valor={c.tomDeVoz} />
              <Campo rotulo="Redes sociais" valor={c.redesSociais} />
              <Campo rotulo="Links úteis" valor={c.linksUteis} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Sem brand kit preenchido. <Link href={`/cadastros/clientes/${id}`} className="underline">Completar</Link>.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Campo rotulo="Documento" valor={c.documento} />
          <Campo rotulo="Contato" valor={c.contatoNome} />
          <Campo rotulo="E-mail" valor={c.email} />
          <Campo rotulo="Telefone" valor={c.telefone} />
          <Campo rotulo="Endereço" valor={[c.endereco, c.cep].filter(Boolean).join(" · ") || null} />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 border-dashed">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            O <strong>dossiê estratégico</strong> (objetivos, público-alvo, concorrentes, posicionamento,
            &ldquo;o que precisamos saber antes de produzir&rdquo;…) chega numa próxima atualização da Estação.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const abaDemandas = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{ck.abertas} demanda{ck.abertas === 1 ? "" : "s"} aberta{ck.abertas === 1 ? "" : "s"} · {ck.atrasadas} atrasada{ck.atrasadas === 1 ? "" : "s"}</p>
        <Button asChild variant="outline" size="sm"><Link href={`/jobs?view=lista&clienteId=${id}`}><ListChecks className="size-4" /> Abrir nos Jobs</Link></Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {jobsAtivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma demanda aberta.</p>
          ) : (
            <ul className="divide-y divide-border">
              {jobsAtivos.map((j) => (
                <li key={j.id} className="py-2">
                  <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                    <span className="min-w-0"><span className="text-muted-foreground tabular-nums">#{j.numero}</span> {j.titulo}<span className="block text-xs text-muted-foreground">{rotuloTipoJob(j.tipo)}{j.prazo ? ` · ${dataBR(j.prazo)}` : ""}</span></span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${j.status.cor ?? "#9ca3af"}22`, color: j.status.cor ?? "#6b7280" }}>{j.status.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Filtros por período, tipo, responsável e status chegam na próxima atualização.</p>
    </>
  );

  const abaAprovacoes = (
    <>
      <div className="flex justify-end">
        <Button asChild size="sm"><Link href={`/jobs/aprovacao-lote/novo?cliente=${id}`}><Layers className="size-4" /> Nova rodada de aprovação</Link></Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Hourglass className="size-4" /> Aguardando o cliente ({estacao.aguardandoLista.length})</CardTitle></CardHeader>
          <CardContent>
            {estacao.aguardandoLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada aguardando aprovação.</p>
            ) : (
              <ul className="divide-y divide-border">
                {estacao.aguardandoLista.map((j) => (
                  <li key={j.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                    <Link href={`/jobs/${j.id}`} className="min-w-0 truncate hover:underline">{j.titulo}</Link>
                    <span className="flex shrink-0 items-center gap-2">
                      {j.aprovacaoEm && <span className="text-xs text-muted-foreground">desde {dataBR(j.aprovacaoEm)}</span>}
                      {j.aprovacaoToken && (
                        <a href={`/aprovar/${j.aprovacaoToken}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium hover:bg-muted/70">
                          Link <ExternalLink className="size-3" />
                        </a>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><PenLine className="size-4" /> Ajustes solicitados ({estacao.ajustesLista.length})</CardTitle></CardHeader>
          <CardContent>
            {estacao.ajustesLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum ajuste pendente. 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {estacao.ajustesLista.map((j) => (
                  <li key={j.id} className="py-2 text-sm">
                    <Link href={`/jobs/${j.id}`} className="hover:underline"><span className="text-muted-foreground tabular-nums">#{j.numero}</span> {j.titulo}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

  const abaReunioes = (
    <>
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {estacao.proximoCompromisso
            ? <>Próximo encontro: <strong className="text-foreground">{estacao.proximoCompromisso.titulo}</strong> · {formatDate(estacao.proximoCompromisso.inicio)}</>
            : "Nenhum encontro agendado."}
        </div>
        <Button asChild size="sm"><Link href={`/reunioes/novo?cliente=${id}`}><NotebookPen className="size-4" /> Registrar reunião</Link></Button>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Últimas reuniões</CardTitle></CardHeader>
        <CardContent>
          {estacao.reunioesLista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma reunião registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {estacao.reunioesLista.map((r) => (
                <li key={r.id} className="py-2 text-sm">
                  <Link href={`/reunioes/${r.id}`} className="flex items-center justify-between gap-2 hover:underline">
                    <span className="min-w-0 truncate">{r.titulo}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(r.data)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">A linha do tempo de relacionamento (tudo que aconteceu na conta, em ordem) chega numa próxima atualização.</p>
    </>
  );

  const abaArquivos = (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Paperclip className="size-4" /> Arquivos do cliente</CardTitle></CardHeader>
      <CardContent><AttachmentsPanel entidadeTipo="cliente" entidadeId={id} /></CardContent>
    </Card>
  );

  const abaResultados = (
    <>
      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <a href={`/imprimir/cliente/${id}?ano=${new Date().getFullYear()}&mes=${new Date().getMonth() + 1}`} target="_blank" rel="noopener noreferrer">
            <FileText className="size-4" /> Relatório do mês
          </a>
        </Button>
      </div>
      {c.lookerEmbedUrl ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4" /> Performance (Looker Studio)</CardTitle></CardHeader>
          <CardContent>
            <iframe src={c.lookerEmbedUrl} className="h-[70vh] min-h-[480px] w-full rounded-lg border border-border" allow="fullscreen" title="Performance" />
          </CardContent>
        </Card>
      ) : (
        <EmBreve texto="Sem painel do Looker Studio cadastrado para este cliente. Os indicadores operacionais (% no prazo, tempo de aprovação, retrabalho) chegam numa próxima atualização." />
      )}
    </>
  );

  const abaContrato = podeFinanceiro ? (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Repeat} rotulo={resumo.contratosAtivos ? `Contrato mensal (${resumo.contratosAtivos})` : "Contrato mensal"} valor={resumo.mrr > 0 ? formatBRL(resumo.mrr) : "—"} destaque={resumo.mrr > 0} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Contratos</CardTitle></CardHeader>
        <CardContent>
          {estacao.contratosLista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum contrato cadastrado. <Link href="/contratos" className="underline">Abrir contratos</Link>.</p>
          ) : (
            <ul className="divide-y divide-border">
              {estacao.contratosLista.map((ct) => (
                <li key={ct.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{ct.descricao || "Contrato"}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatDate(ct.dataInicio)}{ct.dataFim ? ` → ${formatDate(ct.dataFim)}` : " → vigente"}{ct.diaVencimento ? ` · vence dia ${ct.diaVencimento}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold tabular-nums">{formatBRL(Number(ct.valorMensal))}</span>
                    <span className={cn("text-xs", ct.status === "ativo" ? "text-emerald-600" : "text-muted-foreground")}>{ct.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      {c.condicoesComerciais && (
        <Card>
          <CardHeader><CardTitle className="text-base">Condições comerciais</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{c.condicoesComerciais}</p></CardContent>
        </Card>
      )}
      <p className="text-xs text-muted-foreground">O consumo de escopo (contratado × utilizado × saldo) chega numa próxima atualização.</p>
    </>
  ) : (
    <EmBreve texto="As informações de contrato e financeiro são visíveis só para quem tem acesso ao módulo Financeiro." />
  );

  const abas: AbaEstacao[] = [
    { valor: "visao-geral", rotulo: "Visão Geral", conteudo: abaVisaoGeral },
    { valor: "dossie", rotulo: "Dossiê", conteudo: abaDossie },
    { valor: "planejamento", rotulo: "Planejamento", conteudo: <EmBreve texto="O planejamento da conta (objetivo do período, pilares de conteúdo, campanhas do mês, verba) chega numa próxima atualização da Estação." /> },
    { valor: "demandas", rotulo: "Demandas", badge: ck.abertas, conteudo: abaDemandas },
    { valor: "aprovacoes", rotulo: "Aprovações", badge: ck.aguardandoCliente + ck.ajustes, conteudo: abaAprovacoes },
    { valor: "reunioes", rotulo: "Reuniões", conteudo: abaReunioes },
    { valor: "arquivos", rotulo: "Arquivos", conteudo: abaArquivos },
    { valor: "resultados", rotulo: "Resultados", conteudo: abaResultados },
    { valor: "contrato", rotulo: "Contrato & Financeiro", conteudo: abaContrato },
    { valor: "historico", rotulo: "Histórico", conteudo: (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><HistoryIcon className="size-4" /> Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="cliente" entidadeId={id} /></CardContent>
      </Card>
    ) },
  ];
  const abaInicial = abas.some((a) => a.valor === aba) ? (aba as string) : "visao-geral";

  return (
    <div className="space-y-6">
      <BrandHero
        titulo={c.nomeFantasia || c.nome}
        subtitulo={`Estação do Cliente${c.nomeFantasia ? ` · ${c.nome}` : ""}`}
        inicial={iniciais(c.nomeFantasia || c.nome)}
        logoUrl={c.logoUrl}
        statusLabel={st?.label}
        statusCor={STATUS_COR[c.status]}
        acoes={
          <>
            <Button asChild size="sm"><Link href={`/jobs/novo?cliente=${id}`}><Plus className="size-4" /> Nova demanda</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/reunioes/novo?cliente=${id}`}><NotebookPen className="size-4" /> Registrar reunião</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/jobs/aprovacao-lote/novo?cliente=${id}`}><Layers className="size-4" /> Enviar para aprovação</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href={`/clientes/${id}?aba=arquivos`}><Paperclip className="size-4" /> Adicionar arquivo</Link></Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/imprimir/cliente/${id}?ano=${new Date().getFullYear()}&mes=${new Date().getMonth() + 1}`} target="_blank" rel="noopener noreferrer">
                <FileText className="size-4" /> Gerar relatório
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm"><Link href={`/cadastros/clientes/${id}`}><Pencil className="size-4" /> Editar cadastro</Link></Button>
          </>
        }
      />

      {/* Faixa de contexto da conta */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-6 text-sm">
          <span className="text-muted-foreground">Conta desde <strong className="text-foreground">{mesAno(contaDesde)}</strong></span>
          {estacao.proximoCompromisso && (
            <span className="text-muted-foreground">Próximo encontro: <strong className="text-foreground">{formatDate(estacao.proximoCompromisso.inicio)}</strong></span>
          )}
          {estacao.ultimaInteracao && (
            <span className="min-w-0 truncate text-muted-foreground">Última interação: <strong className="text-foreground">{formatDate(estacao.ultimaInteracao.data)}</strong> · {estacao.ultimaInteracao.descricao}</span>
          )}
          {podeFinanceiro && resumo.mrr > 0 && (
            <span className="text-muted-foreground">MRR: <strong className="text-foreground tabular-nums">{formatBRL(resumo.mrr)}</strong></span>
          )}
          <span className="ms-auto">
            <ResponsaveisConta
              clienteId={id}
              usuarios={usuarios.map((u) => ({ id: u.id, nome: u.nome }))}
              atendimentoId={c.atendimento?.id ?? null}
              estrategiaId={c.estrategia?.id ?? null}
              podeEditar={podeEditar}
            />
          </span>
        </CardContent>
      </Card>

      <EstacaoTabs key={abaInicial} abas={abas} inicial={abaInicial} />
    </div>
  );
}
