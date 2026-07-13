import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ListChecks, CheckSquare, ArrowRight, ExternalLink, BarChart3, History, Video, Image as ImageIcon, FileText, Instagram, Sparkles } from "lucide-react";
import { obterPortal } from "@/lib/portal/queries";
import { rotuloTipoJob, corTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { Logo } from "@/components/brand/logo";
import { iniciais } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal do cliente — Plante" };

function diaCurto(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "";
}
function mesCurto(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await obterPortal(token);
  if (!dados) notFound();

  const { cliente, jobs, postagens, aprovacoes, producao, timeline } = dados;
  const nome = cliente.nomeFantasia || cliente.nome;
  const temPerformance = !!cliente.lookerEmbedUrl;

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Cabeçalho branded (largura total) */}
      <header className="bg-chrome text-chrome-foreground">
        <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8 sm:py-10">
          <div className="flex items-center justify-between gap-3">
            <Logo />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-chrome-foreground/50">Portal do cliente</span>
          </div>
          <div className="flex items-center gap-4">
            {cliente.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cliente.logoUrl} alt={nome} className="size-14 shrink-0 rounded-2xl bg-white object-contain p-1" />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow font-display text-xl font-extrabold text-ink-900">
                {iniciais(nome)}
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold leading-tight">{nome}</h1>
              <p className="text-sm text-chrome-foreground/60">Acompanhe aqui o andamento dos seus trabalhos com a Plante.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        {temPerformance ? (
          <Tabs defaultValue="acompanhamento" className="space-y-5">
            <TabsList>
              <TabsTrigger value="acompanhamento"><ListChecks className="mr-1.5 size-4" /> Acompanhamento</TabsTrigger>
              <TabsTrigger value="performance"><BarChart3 className="mr-1.5 size-4" /> Performance</TabsTrigger>
            </TabsList>
            <TabsContent value="acompanhamento" className="space-y-5">
              <Acompanhamento aprovacoes={aprovacoes} postagens={postagens} jobs={jobs} producao={producao} timeline={timeline} />
            </TabsContent>
            <TabsContent value="performance">
              <iframe
                src={cliente.lookerEmbedUrl!}
                className="h-[calc(100vh-220px)] min-h-[560px] w-full rounded-2xl border border-border bg-card"
                allow="fullscreen"
                title={`Performance — ${nome}`}
              />
              <p className="mt-2 text-center text-xs text-muted-foreground">Dados de desempenho atualizados automaticamente.</p>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-5">
            <Acompanhamento aprovacoes={aprovacoes} postagens={postagens} jobs={jobs} producao={producao} timeline={timeline} />
          </div>
        )}

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          Portal exclusivo de acompanhamento · <span className="font-semibold">Plante Comunicação</span>
        </footer>
      </main>
    </div>
  );
}

type Producao = { mesLabel: string; posts: number; videos: number; materiais: number; producoes: number; minutos: number };
type TimelineItem = { id: string; numero: number; titulo: string; tipo: string; data: Date | null; linkPublicado: string | null; imagem: string | null };

type AcompanhamentoProps = {
  aprovacoes: { id: string; titulo: string; aprovacaoToken: string | null; prazoPostagem: Date | null }[];
  postagens: { id: string; titulo: string; prazoPostagem: Date | null; aprovacaoStatus: string; formatos: string | null }[];
  jobs: { id: string; titulo: string; tipo: string; prazo: Date | null; status: { nome: string; cor: string | null } }[];
  producao: Producao;
  timeline: TimelineItem[];
};

/** Ícone do tile da linha do tempo, por balde de tipo. */
function IconeTipo({ tipo, className }: { tipo: string; className?: string }) {
  if (["post_estatico", "carrossel", "story"].includes(tipo)) return <Instagram className={className} aria-hidden="true" />;
  if (["reels", "video", "motion"].includes(tipo)) return <Video className={className} aria-hidden="true" />;
  if (["material_grafico", "identidade", "branding"].includes(tipo)) return <ImageIcon className={className} aria-hidden="true" />;
  return <FileText className={className} aria-hidden="true" />;
}

function tituloMes(d: Date) {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Acompanhamento({ aprovacoes, postagens, jobs, producao, timeline }: AcompanhamentoProps) {
  // Posts e Vídeos aparecem sempre (mesmo zerados, p/ conta nova não parecer vazia);
  // os demais só quando têm movimento.
  const todosContadores = [
    { label: "Posts", valor: producao.posts, fixo: true },
    { label: "Vídeos", valor: producao.videos, fixo: true },
    { label: "Materiais gráficos", valor: producao.materiais, fixo: false },
    { label: "Produções", valor: producao.producoes, fixo: false },
    { label: "Minutos gravados", valor: producao.minutos, fixo: false },
  ];
  const contadores = todosContadores.filter((c) => c.fixo || c.valor > 0);
  const temEntregaNoMes = todosContadores.some((c) => c.valor > 0);

  // Agrupa a linha do tempo por mês (a ordem já vem do mais recente).
  const gruposTimeline: { mes: string; itens: TimelineItem[] }[] = [];
  for (const it of timeline) {
    if (!it.data) continue;
    const mes = tituloMes(it.data);
    const grupo = gruposTimeline.find((g) => g.mes === mes);
    if (grupo) grupo.itens.push(it);
    else gruposTimeline.push({ mes, itens: [it] });
  }

  return (
    <>
        {/* O que fizemos juntos — mini-dashboard do mês (sempre visível) */}
        <section className="overflow-hidden rounded-2xl border-2 border-[#f7ff19]/70 bg-[#f7ff19]/10 p-5 sm:p-6">
          <h2 className="flex flex-wrap items-center gap-x-2 text-xs font-bold uppercase tracking-[0.14em] text-ink-900 dark:text-brand-yellow">
            <Sparkles className="size-4 text-brand-yellow" aria-hidden="true" /> O que fizemos juntos
            <span className="font-sans text-[11px] font-medium normal-case tracking-normal text-muted-foreground">· {producao.mesLabel}</span>
          </h2>
          <div className="mt-5 flex flex-wrap gap-x-9 gap-y-5">
            {contadores.map((c) => (
              <div key={c.label}>
                <p className="font-display text-4xl font-extrabold leading-none tabular-nums text-ink-900 dark:text-foreground">{c.valor}</p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>
          {!temEntregaNoMes && (
            <p className="mt-4 text-xs text-muted-foreground">As primeiras entregas do mês aparecem aqui assim que forem concluídas. 🌱</p>
          )}
        </section>

        {/* Linha do tempo — feed do que já foi entregue, por mês */}
        {gruposTimeline.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
              <History className="size-4 text-muted-foreground" aria-hidden="true" /> Linha do tempo
            </h2>
            <div className="space-y-7">
              {gruposTimeline.map((g) => (
                <div key={g.mes}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.mes}</p>
                  <div className="space-y-4">
                    {g.itens.map((it) => (
                      <article key={it.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                        <div className="relative aspect-[4/5] w-full">
                          {it.imagem ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.imagem} alt={it.titulo} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center" style={{ background: corTipoJob(it.tipo) }}>
                              <IconeTipo tipo={it.tipo} className="size-12 text-white/90" />
                            </div>
                          )}
                          <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur">
                            {rotuloTipoJob(it.tipo)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3 p-4">
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{it.titulo}</span>
                            <span className="block text-xs text-muted-foreground">{it.data ? diaCurto(it.data) : ""}</span>
                          </span>
                          {it.linkPublicado && (
                            <a href={it.linkPublicado} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/70">
                              Ver post <ExternalLink className="size-3.5" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Aprovações pendentes — ação do cliente, em destaque */}
        {aprovacoes.length > 0 && (
          <section className="rounded-2xl border-2 border-brand-yellow bg-[#f7ff19]/10 p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-ink-900 dark:text-brand-yellow">
              <CheckSquare className="size-4" aria-hidden="true" /> Aguardando sua aprovação ({aprovacoes.length})
            </h2>
            <ul className="space-y-2">
              {aprovacoes.map((a) => (
                <li key={a.id}>
                  <Link href={`/aprovar/${a.aprovacaoToken}`} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted">
                    <span className="min-w-0 truncate">{a.titulo}{a.prazoPostagem ? ` · vai ao ar ${diaCurto(a.prazoPostagem)}` : ""}</span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-yellow px-2.5 py-1 text-xs font-bold text-ink-900">
                      Revisar <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Próximas postagens (só quando há) */}
        {postagens.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
              <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /> Próximas postagens
            </h2>
            <ul className="space-y-2.5">
              {postagens.map((p) => {
                const formatos = rotulosFormatos(p.formatos);
                const d = p.prazoPostagem ? new Date(p.prazoPostagem) : null;
                return (
                  <li key={p.id} className="flex items-center gap-3">
                    <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-muted text-center leading-none">
                      <span className="font-display text-base font-bold tabular-nums">{d ? d.getDate() : "—"}</span>
                      <span className="text-[10px] uppercase text-muted-foreground">{d ? mesCurto(d) : ""}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{p.titulo}</span>
                      {formatos.length > 0 && <span className="block truncate text-xs text-muted-foreground">{formatos.join(" · ")}</span>}
                    </span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${corAprovacao(p.aprovacaoStatus)}22`, color: corAprovacao(p.aprovacaoStatus) }}>
                      {p.aprovacaoStatus === "rascunho" ? "Em produção" : rotuloAprovacao(p.aprovacaoStatus)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Em andamento (só quando há) */}
        {jobs.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
              <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" /> Em andamento
            </h2>
            <ul className="space-y-2.5">
              {jobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-2 border-b border-border/60 pb-2.5 last:border-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{j.titulo}</span>
                    <span className="block text-xs text-muted-foreground">{rotuloTipoJob(j.tipo)}{j.prazo ? ` · entrega ${diaCurto(j.prazo)}` : ""}</span>
                  </span>
                  <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: `${j.status.cor ?? "#9ca3af"}22`, color: j.status.cor ?? "#6b7280" }}>
                    {j.status.nome}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

    </>
  );
}
