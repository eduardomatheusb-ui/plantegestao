import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Pencil, Plus, ListChecks, FolderKanban, CalendarDays, Hourglass, Repeat, ExternalLink,
  FileText, NotebookPen, Layers, Paperclip, AlertTriangle, PenLine, Megaphone, CalendarClock,
  Users, History as HistoryIcon, BarChart3,
} from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterClienteVisao, estacaoResumo, consumoEscopo, financeiroCliente, timelineRelacionamento, resultadosCliente, type EventoRelacionamento } from "@/lib/clientes/queries";
import { salvarEscopoItem, removerEscopoItem, salvarClienteAcesso, removerClienteAcesso } from "@/lib/clientes/actions";
import { arquivosCliente, planejamentoCliente } from "@/lib/clientes/queries";
import { saudeConta } from "@/lib/clientes/saude-conta";
import { BUCKETS_ESCOPO } from "@/lib/clientes/escopo";
import { listarOnboarding } from "@/lib/onboarding/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { listarJobs, listarStatus } from "@/lib/jobs/queries";
import { listarLotesDoCliente } from "@/lib/aprovacao/lote.queries";
import { CLIENTE_STATUS } from "@/lib/cadastros/registry";
import { CAMPOS_DOSSIE } from "@/lib/clientes/dossie";
import { rotuloTipoJob, TIPOS_JOB } from "@/lib/jobs/tipos";
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

const COR_EVENTO: Record<EventoRelacionamento["tipo"], string> = {
  reuniao: "#8b5cf6", aprovacao: "#f59e0b", demanda: "#64748b", entrega: "#10b981", publicacao: "#ec4899", contrato: "#0ea5e9",
};

function FeedRelacionamento({ eventos }: { eventos: EventoRelacionamento[] }) {
  if (eventos.length === 0) return <p className="text-sm text-muted-foreground">Nenhum evento registrado ainda.</p>;
  return (
    <ul className="relative space-y-0.5 before:absolute before:bottom-3 before:left-[5px] before:top-3 before:w-px before:bg-border">
      {eventos.map((e, i) => (
        <li key={i} className="relative flex items-start gap-3 py-1.5 pl-0 text-sm">
          <span className="relative z-10 mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-card" style={{ background: COR_EVENTO[e.tipo] }} aria-hidden="true" />
          <span className="min-w-0">
            <span className="mr-2 text-xs tabular-nums text-muted-foreground">{formatDate(e.data)}</span>
            {e.href ? <Link href={e.href} className="hover:underline">{e.descricao}</Link> : e.descricao}
          </span>
        </li>
      ))}
    </ul>
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
  searchParams: Promise<{ aba?: string; dtipo?: string; dstatus?: string; dresp?: string }>;
}) {
  const acesso = await requireModulo("cadastros", "VER");
  const podeFinanceiro = podeModulo(acesso.caps, "financeiro", "VER");
  const podeEditar = podeModulo(acesso.caps, "cadastros", "EDITAR");
  const { id } = await params;
  const { aba, dtipo, dstatus, dresp } = await searchParams;

  const dados = await obterClienteVisao(id);
  if (!dados) notFound();
  const { cliente: c, jobsAtivos, projetosAtivos, postagens, resumo } = dados;

  const [estacao, onboardingItens, usuarios, statuses, demandas, lotes, consumo, fin] = await Promise.all([
    estacaoResumo(id),
    listarOnboarding(id),
    listarUsuariosAtivos(),
    listarStatus(),
    listarJobs({ clienteId: id, tipo: dtipo || undefined, statusId: dstatus || undefined, responsavelId: dresp || undefined }),
    listarLotesDoCliente(id),
    consumoEscopo(id),
    podeFinanceiro ? financeiroCliente(id) : Promise.resolve(null),
  ]);
  const [relacionamento, resultados, saude, arquivos, planejamento] = await Promise.all([
    timelineRelacionamento(id), resultadosCliente(id), saudeConta(id), arquivosCliente(id), planejamentoCliente(id),
  ]);
  const COR_SAUDE = { verde: "#10b981", amarelo: "#f59e0b", vermelho: "#ef4444" } as const;
  // Motivos contratuais (renovação) são visíveis só para quem vê o Financeiro.
  const saudeMotivos = podeFinanceiro ? saude.motivos : saude.motivos.filter((m) => !m.startsWith("contrato encerra"));
  if (!podeFinanceiro && saudeMotivos.length < saude.motivos.length) saudeMotivos.push("há um ponto de atenção contratual (detalhes no Financeiro)");

  const st = statusInfo(c.status);
  const ck = estacao.cockpit;
  const contaDesde = estacao.contaDesde ?? c.criadoEm;
  const mesesRelatorio = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
    return { ano: d.getFullYear(), mes: d.getMonth() + 1, rotulo: mesAno(d) };
  });

  // ── Conteúdo das abas ──────────────────────────────────────────────

  const abaVisaoGeral = (
    <>
      {/* Saúde da conta — com o motivo, sempre */}
      <Card style={{ borderColor: `${COR_SAUDE[saude.cor]}66` }}>
        <CardContent className="flex flex-wrap items-start gap-3 pt-6">
          <span className="mt-0.5 inline-flex size-3 shrink-0 rounded-full" style={{ background: COR_SAUDE[saude.cor] }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Saúde da conta: <span style={{ color: COR_SAUDE[saude.cor] }}>{saude.rotulo}</span>
            </p>
            {saudeMotivos.length > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">{saudeMotivos.join(" · ")}.</p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">Nenhum ponto de atenção nos últimos 90 dias.</p>
            )}
          </div>
        </CardContent>
      </Card>

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

  const dossie = (c.dossie ?? {}) as Record<string, string | null>;
  const dossiePreenchido = CAMPOS_DOSSIE.some((campo) => dossie[campo.name]);

  const abaDossie = (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Regra de ouro da conta — sempre no topo, em destaque */}
      {dossie.antesDeProduzir && (
        <Card className="lg:col-span-2 border-2 border-brand-yellow/60 bg-[#f7ff19]/10">
          <CardHeader><CardTitle className="text-base">⚠️ Antes de produzir</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{dossie.antesDeProduzir}</p></CardContent>
        </Card>
      )}

      <div className="lg:col-span-2 flex justify-end">
        <Button asChild variant="outline" size="sm"><Link href={`/clientes/${id}/dossie`}><Pencil className="size-4" /> Editar dossiê</Link></Button>
      </div>

      {dossiePreenchido ? (
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Dossiê estratégico</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {CAMPOS_DOSSIE.filter((campo) => campo.name !== "antesDeProduzir").map((campo) => (
              <Campo key={campo.name} rotulo={campo.label} valor={dossie[campo.name]} />
            ))}
          </CardContent>
        </Card>
      ) : (
        <Card className="lg:col-span-2 border-dashed">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              O dossiê estratégico ainda não foi preenchido — é a memória da conta (objetivos, público,
              concorrentes, restrições, &ldquo;o que precisamos saber antes de produzir&rdquo;).{" "}
              <Link href={`/clientes/${id}/dossie`} className="underline">Preencher agora</Link>.
            </p>
          </CardContent>
        </Card>
      )}

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

    </div>
  );

  const selFiltro = "h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const abaDemandas = (
    <>
      {dossie.antesDeProduzir && (
        <div className="rounded-lg border-2 border-brand-yellow/60 bg-[#f7ff19]/10 px-4 py-3 text-sm">
          <strong>Antes de produzir:</strong> {dossie.antesDeProduzir}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Filtros (GET — preserva a aba) */}
        <form method="get" className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="aba" value="demandas" />
          <label htmlFor="dtipo" className="sr-only">Tipo</label>
          <select id="dtipo" name="dtipo" defaultValue={dtipo ?? ""} className={selFiltro}>
            <option value="">Todos os tipos</option>
            {TIPOS_JOB.map((t) => (<option key={t.key} value={t.key}>{t.label}</option>))}
          </select>
          <label htmlFor="dstatus" className="sr-only">Status</label>
          <select id="dstatus" name="dstatus" defaultValue={dstatus ?? ""} className={selFiltro}>
            <option value="">Todos os status</option>
            {statuses.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
          </select>
          <label htmlFor="dresp" className="sr-only">Responsável</label>
          <select id="dresp" name="dresp" defaultValue={dresp ?? ""} className={selFiltro}>
            <option value="">Todos os responsáveis</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
          <Button type="submit" variant="outline" size="sm">Filtrar</Button>
          {(dtipo || dstatus || dresp) && (
            <Button asChild variant="ghost" size="sm"><Link href={`/clientes/${id}?aba=demandas`}>Limpar</Link></Button>
          )}
        </form>
        <Button asChild variant="outline" size="sm"><Link href={`/jobs?view=lista&clienteId=${id}`}><ListChecks className="size-4" /> Abrir nos Jobs</Link></Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          {demandas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma demanda com esses filtros.</p>
          ) : (
            <ul className="divide-y divide-border">
              {demandas.map((j) => (
                <li key={j.id} className="py-2">
                  <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                    <span className="min-w-0">
                      <span className="text-muted-foreground tabular-nums">#{j.numero}</span> {j.titulo}
                      <span className="block text-xs text-muted-foreground">
                        {rotuloTipoJob(j.tipo)}
                        {j.responsavel ? ` · ${j.responsavel.nome}` : ""}
                        {j.prazo ? ` · ${dataBR(j.prazo)}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${j.status.cor ?? "#9ca3af"}22`, color: j.status.cor ?? "#6b7280" }}>{j.status.nome}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">{demandas.length} demanda{demandas.length === 1 ? "" : "s"} · {ck.atrasadas} atrasada{ck.atrasadas === 1 ? "" : "s"}</p>
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
                    {j.ultimoAjuste && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        &ldquo;{j.ultimoAjuste.comentario ?? "sem comentário"}&rdquo;
                        {j.ultimoAjuste.autor ? ` — ${j.ultimoAjuste.autor}` : ""} · {dataBR(j.ultimoAjuste.criadoEm)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ListChecks className="size-4" /> Aprovadas recentemente</CardTitle></CardHeader>
          <CardContent>
            {estacao.aprovadasLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma peça aprovada ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {estacao.aprovadasLista.map((j) => (
                  <li key={j.id} className="py-2 text-sm">
                    <Link href={`/jobs/${j.id}`} className="hover:underline"><span className="text-muted-foreground tabular-nums">#{j.numero}</span> {j.titulo}</Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Layers className="size-4" /> Rodadas de aprovação</CardTitle></CardHeader>
          <CardContent>
            {lotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma rodada criada para este cliente.</p>
            ) : (
              <ul className="divide-y divide-border">
                {lotes.map((l) => (
                  <li key={l.id} className="py-2 text-sm">
                    <Link href={`/jobs/aprovacao-lote/${l.id}`} className="flex items-center justify-between gap-2 hover:underline">
                      <span className="min-w-0 truncate">{l.titulo || "Rodada de aprovação"} · {l._count.itens} peça{l._count.itens === 1 ? "" : "s"}</span>
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", l.status === "encerrado" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                        {l.status === "encerrado" ? "Concluída" : "Aberta"}
                      </span>
                    </Link>
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
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><HistoryIcon className="size-4" /> Linha do tempo do relacionamento</CardTitle></CardHeader>
        <CardContent><FeedRelacionamento eventos={relacionamento} /></CardContent>
      </Card>
    </>
  );

  const abaArquivos = (
    <>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Paperclip className="size-4" /> Arquivos do cliente</CardTitle></CardHeader>
        <CardContent><AttachmentsPanel entidadeTipo="cliente" entidadeId={id} /></CardContent>
      </Card>

      {/* Documentos que já vivem no sistema */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" /> Documentos no TREM</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Propostas</p>
            {arquivos.propostas.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : (
              <ul className="space-y-1 text-sm">
                {arquivos.propostas.map((p) => (
                  <li key={p.id}><Link href={`/propostas/${p.id}`} className="hover:underline"><span className="text-muted-foreground tabular-nums">#{p.numero}</span> {p.titulo}</Link></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Atas de reunião</p>
            {estacao.reunioesLista.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma.</p> : (
              <ul className="space-y-1 text-sm">
                {estacao.reunioesLista.map((r) => (
                  <li key={r.id}><Link href={`/reunioes/${r.id}`} className="hover:underline">{r.titulo} <span className="text-xs text-muted-foreground">· {formatDate(r.data)}</span></Link></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relatórios mensais</p>
            <ul className="space-y-1 text-sm">
              {mesesRelatorio.slice(0, 4).map((m) => (
                <li key={`${m.ano}-${m.mes}`}>
                  <a href={`/imprimir/cliente/${id}?ano=${m.ano}&mes=${m.mes}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{m.rotulo}</a>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Acessos — nunca senha, só onde está e quem tem */}
      <Card>
        <CardHeader><CardTitle className="text-base">Acessos do cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            ⚠️ Aqui registramos <strong>onde</strong> cada acesso está guardado e <strong>quem</strong> tem — nunca a senha em si.
          </p>
          {arquivos.acessos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Plataforma</th>
                    <th className="py-2 pr-2 font-medium">Conta</th>
                    <th className="py-2 pr-2 font-medium">Onde está</th>
                    <th className="py-2 pr-2 font-medium">Quem tem</th>
                    {podeEditar && <th className="py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {arquivos.acessos.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-2 font-medium">{a.plataforma}</td>
                      <td className="py-2 pr-2">{a.identificacao ?? "—"}</td>
                      <td className="py-2 pr-2">{a.ondeGuardado ?? "—"}</td>
                      <td className="py-2 pr-2">{a.quemTemAcesso ?? "—"}</td>
                      {podeEditar && (
                        <td className="py-2 pl-2 text-right">
                          <form action={removerClienteAcesso.bind(null, a.id)}>
                            <button type="submit" className="text-xs text-muted-foreground hover:text-destructive">remover</button>
                          </form>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {podeEditar && (
            <form action={salvarClienteAcesso.bind(null, id)} className="grid grid-cols-1 items-end gap-2 border-t border-border pt-4 sm:grid-cols-5">
              <div className="space-y-1">
                <label htmlFor="ac-plat" className="text-xs text-muted-foreground">Plataforma</label>
                <input id="ac-plat" name="plataforma" required placeholder="Ex.: Meta Business" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="ac-id" className="text-xs text-muted-foreground">Conta/página</label>
                <input id="ac-id" name="identificacao" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="ac-onde" className="text-xs text-muted-foreground">Onde está guardado</label>
                <input id="ac-onde" name="ondeGuardado" placeholder="Ex.: cofre do Drive" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
              </div>
              <div className="space-y-1">
                <label htmlFor="ac-quem" className="text-xs text-muted-foreground">Quem tem acesso</label>
                <input id="ac-quem" name="quemTemAcesso" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" />
              </div>
              <Button type="submit" variant="outline" size="sm">Adicionar</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </>
  );

  const op = resultados.operacionais;
  const fmtOp = (v: number | null, sufixo = "") => (v == null ? "—" : `${v}${sufixo}`);

  const abaResultados = (
    <>
      {/* Operacionais — mesmas fórmulas do Painel Estratégico, recortadas pro cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Indicadores operacionais <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">últimos {resultados.janelaDias} dias</span></CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {[
              { k: "Entregas no prazo", v: fmtOp(op.pctNoPrazo, "%") },
              { k: "Ciclo médio (dias)", v: fmtOp(op.cicloMedio) },
              { k: "Publicado no dia", v: fmtOp(op.pctPublicadoNoDia, "%") },
              { k: "Postagens remarcadas", v: fmtOp(op.pctRemarcadas, "%") },
              { k: "Aprovado de 1ª", v: fmtOp(op.pctPrimeiraRodada, "%") },
              { k: "Rodadas por peça", v: fmtOp(op.rodadasMedia) },
              { k: "Tempo de aprovação (dias)", v: fmtOp(op.tempoAprovacao) },
            ].map((m) => (
              <div key={m.k}>
                <p className="font-display text-2xl font-bold tabular-nums">{m.v}</p>
                <p className="text-xs text-muted-foreground">{m.k}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Produção realizada */}
      <Card>
        <CardHeader><CardTitle className="text-base">Produção realizada <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">últimos {resultados.janelaDias} dias</span></CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
            {[
              { k: "Posts", v: resultados.producao.posts },
              { k: "Vídeos", v: resultados.producao.videos },
              { k: "Materiais gráficos", v: resultados.producao.materiais },
              { k: "Minutos gravados", v: resultados.producao.minutos },
            ].filter((m) => m.v > 0).map((m) => (
              <div key={m.k}>
                <p className="font-display text-2xl font-bold tabular-nums">{m.v}</p>
                <p className="text-xs text-muted-foreground">{m.k}</p>
              </div>
            ))}
          </div>
          {resultados.producao.posts + resultados.producao.videos + resultados.producao.materiais === 0 && (
            <p className="text-sm text-muted-foreground">Nada concluído na janela.</p>
          )}
        </CardContent>
      </Card>

      {/* Campanhas (tráfego) */}
      {resultados.campanhas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Megaphone className="size-4" /> Campanhas</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Campanha</th>
                  <th className="py-2 pr-2 font-medium">Status</th>
                  <th className="py-2 pr-2 font-medium text-right">Investido</th>
                  <th className="py-2 pr-2 font-medium text-right">Leads</th>
                  <th className="py-2 pr-2 font-medium text-right">CPL</th>
                  <th className="py-2 font-medium text-right">CTR</th>
                </tr>
              </thead>
              <tbody>
                {resultados.campanhas.map((cp) => (
                  <tr key={cp.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-2"><Link href={`/trafego/${cp.id}`} className="hover:underline">{cp.nome}</Link> <span className="text-xs text-muted-foreground">· {cp.plataforma}</span></td>
                    <td className="py-2 pr-2">{cp.status}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{cp.investido > 0 ? formatBRL(cp.investido) : "—"}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{cp.leads || "—"}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{cp.cpl != null ? formatBRL(cp.cpl) : "—"}</td>
                    <td className="py-2 text-right tabular-nums">{cp.ctr != null ? `${cp.ctr}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Looker */}
      {c.lookerEmbedUrl && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="size-4" /> Performance (Looker Studio)</CardTitle></CardHeader>
          <CardContent>
            <iframe src={c.lookerEmbedUrl} className="h-[70vh] min-h-[480px] w-full rounded-lg border border-border" allow="fullscreen" title="Performance" />
          </CardContent>
        </Card>
      )}

      {/* Histórico de relatórios */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" /> Relatórios mensais</CardTitle></CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {mesesRelatorio.map((m) => (
              <li key={`${m.ano}-${m.mes}`}>
                <a
                  href={`/imprimir/cliente/${id}?ano=${m.ano}&mes=${m.mes}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm hover:bg-muted"
                >
                  <FileText className="size-3.5" aria-hidden="true" /> {m.rotulo}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );

  // Alertas de vigência/reajuste dos contratos ativos.
  const agoraMs = Date.now();
  const diaMs = 24 * 3600 * 1000;
  const alertasContrato: { tipo: "renovacao" | "reajuste"; texto: string }[] = [];
  for (const ct of estacao.contratosLista) {
    if (ct.status !== "ativo") continue;
    if (ct.dataFim) {
      const dias = Math.ceil((new Date(ct.dataFim).getTime() - agoraMs) / diaMs);
      if (dias >= 0 && dias <= 60) alertasContrato.push({ tipo: "renovacao", texto: `Contrato${ct.descricao ? ` "${ct.descricao}"` : ""} encerra em ${dias} dia${dias === 1 ? "" : "s"} — iniciar processo de renovação.` });
      else if (dias < 0) alertasContrato.push({ tipo: "renovacao", texto: `Contrato${ct.descricao ? ` "${ct.descricao}"` : ""} venceu há ${Math.abs(dias)} dia${Math.abs(dias) === 1 ? "" : "s"} e segue ativo — regularizar.` });
    }
    if (ct.reajusteEm) {
      const dias = Math.ceil((new Date(ct.reajusteEm).getTime() - agoraMs) / diaMs);
      if (dias >= 0 && dias <= 45) alertasContrato.push({ tipo: "reajuste", texto: `Reajuste${ct.reajusteObs ? ` (${ct.reajusteObs})` : ""} previsto em ${dias} dia${dias === 1 ? "" : "s"}.` });
    }
  }

  const quadroConsumo = (
    <Card>
      <CardHeader><CardTitle className="text-base">Consumo do escopo — este mês</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {consumo.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum item de escopo cadastrado. Adicione abaixo o que foi contratado por mês (posts, vídeos, horas de captação…).</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-2 font-medium">Entregável</th>
                  <th className="py-2 pr-2 font-medium text-right">Contratado</th>
                  <th className="py-2 pr-2 font-medium text-right">Utilizado</th>
                  <th className="py-2 pr-2 font-medium text-right">Saldo</th>
                  <th className="w-1/4 py-2 font-medium">Uso</th>
                  {podeEditar && <th className="py-2" />}
                </tr>
              </thead>
              <tbody>
                {consumo.map((item) => {
                  const pct = item.utilizado == null || item.contratado === 0 ? 0 : Math.min(100, Math.round((item.utilizado / item.contratado) * 100));
                  const estourou = item.saldo != null && item.saldo < 0;
                  return (
                    <tr key={item.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2 pr-2">{item.rotulo}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{item.contratado}{item.unidade === "horas" ? "h" : ""}</td>
                      <td className="py-2 pr-2 text-right tabular-nums">{item.utilizado == null ? "—" : `${item.utilizado}${item.unidade === "horas" ? "h" : ""}`}</td>
                      <td className={cn("py-2 pr-2 text-right font-medium tabular-nums", estourou && "text-destructive")}>
                        {item.saldo == null ? "—" : `${item.saldo}${item.unidade === "horas" ? "h" : ""}`}
                      </td>
                      <td className="py-2">
                        {item.utilizado != null && (
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className={cn("h-full rounded-full", estourou ? "bg-destructive" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </td>
                      {podeEditar && (
                        <td className="py-2 pl-2 text-right">
                          <form action={removerEscopoItem.bind(null, item.id)}>
                            <button type="submit" className="text-xs text-muted-foreground hover:text-destructive" title="Remover item">remover</button>
                          </form>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {podeEditar && (
          <form action={salvarEscopoItem.bind(null, id)} className="flex flex-wrap items-end gap-2 border-t border-border pt-4">
            <div className="space-y-1">
              <label htmlFor="esc-rotulo" className="text-xs text-muted-foreground">Entregável</label>
              <input id="esc-rotulo" name="rotulo" required placeholder="Ex.: Posts" className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm" />
            </div>
            <div className="space-y-1">
              <label htmlFor="esc-bucket" className="text-xs text-muted-foreground">Conta automática</label>
              <select id="esc-bucket" name="bucket" className={selFiltro}>
                {BUCKETS_ESCOPO.map((b) => (<option key={b.key} value={b.key}>{b.label}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="esc-qtd" className="text-xs text-muted-foreground">Qtd./mês</label>
              <input id="esc-qtd" name="quantidadeMensal" type="number" min="0" required className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm" />
            </div>
            <Button type="submit" variant="outline" size="sm">Adicionar</Button>
          </form>
        )}
        <p className="text-xs text-muted-foreground">O &ldquo;utilizado&rdquo; conta sozinho: jobs concluídos no mês (por tipo), campanhas ativas, reuniões do mês e minutos gravados.</p>
      </CardContent>
    </Card>
  );

  const abaContrato = (
    <>
      {quadroConsumo}

      {podeFinanceiro ? (
        <>
          {/* Alertas contratuais (renovação/reajuste) — só para quem vê o financeiro */}
          {alertasContrato.length > 0 && (
            <div className="space-y-2">
              {alertasContrato.map((a, i) => (
                <div key={i} className={cn("flex items-center gap-2 rounded-lg border px-4 py-3 text-sm", a.tipo === "renovacao" ? "border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" : "border-border bg-muted/40")}>
                  <AlertTriangle className="size-4 shrink-0" aria-hidden="true" /> {a.texto}
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat icon={Repeat} rotulo={resumo.contratosAtivos ? `Contrato mensal (${resumo.contratosAtivos})` : "Contrato mensal"} valor={resumo.mrr > 0 ? formatBRL(resumo.mrr) : "—"} destaque={resumo.mrr > 0} />
            {fin && <Stat icon={CalendarDays} rotulo={`A receber (${fin.aReceber.qtd})`} valor={fin.aReceber.total > 0 ? formatBRL(fin.aReceber.total) : "—"} />}
            {fin && <Stat icon={AlertTriangle} rotulo={`Vencido (${fin.vencido.qtd})`} valor={fin.vencido.total > 0 ? formatBRL(fin.vencido.total) : "—"} alerta={fin.vencido.total > 0} />}
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
                          {formatDate(ct.dataInicio)}{ct.dataFim ? ` → ${formatDate(ct.dataFim)}` : " → vigente"}
                          {ct.diaVencimento ? ` · vence dia ${ct.diaVencimento}` : ""}
                          {ct.reajusteEm ? ` · reajuste ${formatDate(ct.reajusteEm)}${ct.reajusteObs ? ` (${ct.reajusteObs})` : ""}` : ""}
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

          {fin && fin.notas.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Últimas notas fiscais</CardTitle></CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {fin.notas.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0 truncate">NF {n.numero ?? "—"} · {formatDate(n.criadoEm)} · {n.status}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="font-medium tabular-nums">{formatBRL(Number(n.valor))}</span>
                        {n.urlPdf && <a href={n.urlPdf} target="_blank" rel="noopener noreferrer" className="text-xs underline">PDF</a>}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {c.condicoesComerciais && (
            <Card>
              <CardHeader><CardTitle className="text-base">Condições comerciais</CardTitle></CardHeader>
              <CardContent><p className="whitespace-pre-wrap text-sm">{c.condicoesComerciais}</p></CardContent>
            </Card>
          )}
        </>
      ) : (
        <EmBreve texto="Os valores de contrato e a situação financeira são visíveis só para quem tem acesso ao módulo Financeiro. O consumo de escopo acima é visível para toda a equipe." />
      )}
    </>
  );

  const abas: AbaEstacao[] = [
    { valor: "visao-geral", rotulo: "Visão Geral", conteudo: abaVisaoGeral },
    { valor: "dossie", rotulo: "Dossiê", conteudo: abaDossie },
    { valor: "planejamento", rotulo: "Planejamento", conteudo: (
      <>
        <div className="flex justify-end">
          <Button asChild size="sm"><Link href={`/clientes/${id}/planejamento`}><Pencil className="size-4" /> {planejamento.vigente ? "Editar planejamento" : "Criar planejamento do mês"}</Link></Button>
        </div>
        {planejamento.vigente ? (
          <Card className="border-brand-yellow/50">
            <CardHeader>
              <CardTitle className="text-base">
                Planejamento vigente <span className="ml-1 font-sans text-xs font-normal text-muted-foreground">· {String(planejamento.mes).padStart(2, "0")}/{planejamento.ano}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <Campo rotulo="Objetivo principal" valor={planejamento.vigente.objetivoPrincipal} />
              <Campo rotulo="Pilares de conteúdo" valor={planejamento.vigente.pilares} />
              <Campo rotulo="Produtos prioritários" valor={planejamento.vigente.produtosPrioritarios} />
              <Campo rotulo="Datas importantes" valor={planejamento.vigente.datasImportantes} />
              <Campo rotulo="Ações on-line" valor={planejamento.vigente.acoesOnline} />
              <Campo rotulo="Ações off-line" valor={planejamento.vigente.acoesOffline} />
              <Campo rotulo="Produção audiovisual" valor={planejamento.vigente.producaoAudiovisual} />
              <Campo rotulo="Indicadores acompanhados" valor={planejamento.vigente.indicadores} />
              {podeFinanceiro && planejamento.vigente.verbaMidia != null && (
                <Campo rotulo="Verba de mídia" valor={formatBRL(Number(planejamento.vigente.verbaMidia))} />
              )}
            </CardContent>
          </Card>
        ) : (
          <EmBreve texto={`Sem planejamento para ${String(planejamento.mes).padStart(2, "0")}/${planejamento.ano}. Crie o plano do mês — objetivo, pilares, ações e verba — para guiar a produção.`} />
        )}
        {ck.campanhasAtivas > 0 && (
          <p className="text-sm text-muted-foreground">
            {ck.campanhasAtivas} campanha{ck.campanhasAtivas === 1 ? "" : "s"} ativa{ck.campanhasAtivas === 1 ? "" : "s"} — veja os números na aba <strong>Resultados</strong>.
          </p>
        )}
        {planejamento.anteriores.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Planejamentos anteriores</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {planejamento.anteriores.map((p) => (
                  <li key={p.id} className="py-2 text-sm">
                    <Link href={`/clientes/${id}/planejamento?ano=${p.ano}&mes=${p.mes}`} className="flex items-center justify-between gap-2 hover:underline">
                      <span className="min-w-0 truncate">{String(p.mes).padStart(2, "0")}/{p.ano}{p.objetivoPrincipal ? ` — ${p.objetivoPrincipal}` : ""}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{p.status}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </>
    ) },
    { valor: "demandas", rotulo: "Demandas", badge: ck.abertas, conteudo: abaDemandas },
    { valor: "aprovacoes", rotulo: "Aprovações", badge: ck.aguardandoCliente + ck.ajustes, conteudo: abaAprovacoes },
    { valor: "reunioes", rotulo: "Reuniões", conteudo: abaReunioes },
    { valor: "arquivos", rotulo: "Arquivos", conteudo: abaArquivos },
    { valor: "resultados", rotulo: "Resultados", conteudo: abaResultados },
    { valor: "contrato", rotulo: "Contrato & Financeiro", conteudo: abaContrato },
    { valor: "historico", rotulo: "Histórico", conteudo: (
      <>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><HistoryIcon className="size-4" /> Linha do tempo do relacionamento</CardTitle></CardHeader>
          <CardContent><FeedRelacionamento eventos={relacionamento} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Alterações no cadastro</CardTitle></CardHeader>
          <CardContent><HistoryPanel entidadeTipo="cliente" entidadeId={id} /></CardContent>
        </Card>
      </>
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
          <span className="inline-flex items-center gap-1.5 font-medium" title={saudeMotivos.join(" · ") || "Sem pontos de atenção"}>
            <span className="inline-flex size-2.5 rounded-full" style={{ background: COR_SAUDE[saude.cor] }} aria-hidden="true" />
            {saude.rotulo}
          </span>
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
