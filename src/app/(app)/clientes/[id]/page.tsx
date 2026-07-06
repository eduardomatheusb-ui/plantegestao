import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Plus, ListChecks, FolderKanban, CalendarDays, Hourglass, Repeat, ExternalLink } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { obterClienteVisao } from "@/lib/clientes/queries";
import { listarOnboarding } from "@/lib/onboarding/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { CLIENTE_STATUS } from "@/lib/cadastros/registry";
import { rotuloTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { baseUrl } from "@/lib/email";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { PortalPanel } from "@/components/portal/portal-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { iniciais } from "@/lib/format";
import { formatBRL, cn } from "@/lib/utils";

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "—";
}
function statusInfo(s: string) {
  return CLIENTE_STATUS.find((o) => o.value === s);
}
const STATUS_COR: Record<string, string> = {
  ativo: "#34d399", implantacao: "#fbbf24", pausado: "#94a3b8", inadimplente: "#f87171", encerrado: "#9ca3af",
};
function Stat({ icon: Icon, rotulo, valor, destaque }: { icon: typeof ListChecks; rotulo: string; valor: React.ReactNode; destaque?: boolean }) {
  return (
    <Card className={cn(destaque && "border-brand-yellow/60 bg-brand-yellow/10")}>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", destaque ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-bold leading-none tabular-nums">{valor}</p>
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

export default async function ClienteVisaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("cadastros", "VER");
  const { id } = await params;
  const dados = await obterClienteVisao(id);
  if (!dados) notFound();

  const { cliente: c, jobsAtivos, projetosAtivos, postagens, resumo } = dados;
  const [onboardingItens, usuarios] = await Promise.all([listarOnboarding(id), listarUsuariosAtivos()]);
  const st = statusInfo(c.status);

  return (
    <div className="space-y-6">
      {/* Hero com a identidade da Plante */}
      <section className="overflow-hidden rounded-2xl bg-chrome text-chrome-foreground shadow-sm">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {c.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.logoUrl} alt={c.nomeFantasia || c.nome} className="size-14 shrink-0 rounded-2xl bg-white object-contain p-1" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow font-display text-xl font-extrabold text-ink-900">
                {iniciais(c.nomeFantasia || c.nome)}
              </span>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-2xl font-bold leading-tight">{c.nomeFantasia || c.nome}</h1>
                {st && (
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${STATUS_COR[c.status] ?? "#9ca3af"}33`, color: STATUS_COR[c.status] ?? "#cbd5e1" }}>
                    {st.label}
                  </span>
                )}
              </div>
              {c.nomeFantasia && <p className="truncate text-sm text-chrome-foreground/60">{c.nome}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/cadastros/clientes/${id}`} className="inline-flex items-center gap-1.5 rounded-md border border-white-a10 px-3 py-2 text-sm font-medium text-chrome-foreground transition-colors hover:bg-white-a10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow">
              <Pencil className="size-4" aria-hidden="true" /> Editar cadastro
            </Link>
            <Link href={`/jobs/novo?cliente=${id}`} className="inline-flex items-center gap-1.5 rounded-md bg-brand-yellow px-3 py-2 text-sm font-semibold text-ink-900 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-chrome">
              <Plus className="size-4" aria-hidden="true" /> Novo job
            </Link>
          </div>
        </div>
      </section>

      {/* Resumo 360 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={ListChecks} rotulo="Jobs ativos" valor={resumo.jobsAtivos} />
        <Stat icon={CalendarDays} rotulo="Próximas postagens" valor={resumo.postagens} />
        <Stat icon={Hourglass} rotulo="Aguardando aprovação" valor={resumo.aguardandoAprovacao} />
        <Stat icon={Repeat} rotulo={resumo.contratosAtivos ? `Contrato mensal (${resumo.contratosAtivos})` : "Contrato mensal"} valor={resumo.mrr > 0 ? formatBRL(resumo.mrr) : "—"} destaque={resumo.mrr > 0} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trabalho em andamento */}
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

        {/* Brand kit + dados */}
        <div className="space-y-6">
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
              <Campo rotulo="Condições comerciais" valor={c.condicoesComerciais} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ExternalLink className="size-4" /> Portal do cliente</CardTitle></CardHeader>
            <CardContent>
              <PortalPanel clienteId={id} link={c.portalToken ? `${baseUrl()}/portal/${c.portalToken}` : null} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Onboarding / implantação</CardTitle></CardHeader>
        <CardContent><OnboardingPanel clienteId={id} status={c.status} itens={onboardingItens} usuarios={usuarios} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="cliente" entidadeId={id} /></CardContent>
      </Card>
    </div>
  );
}
