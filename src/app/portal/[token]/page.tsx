import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ListChecks, CheckSquare, ArrowRight } from "lucide-react";
import { obterPortal } from "@/lib/portal/queries";
import { rotuloTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { Logo } from "@/components/brand/logo";
import { iniciais } from "@/lib/format";

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

  const { cliente, jobs, postagens, aprovacoes } = dados;
  const nome = cliente.nomeFantasia || cliente.nome;

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
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-brand-yellow font-display text-xl font-extrabold text-ink-900">
              {iniciais(nome)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate font-display text-2xl font-bold leading-tight">{nome}</h1>
              <p className="text-sm text-chrome-foreground/60">Acompanhe aqui o andamento dos seus trabalhos com a Plante.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
        {/* Aprovações pendentes — ação do cliente, em destaque */}
        {aprovacoes.length > 0 && (
          <section className="rounded-2xl border-2 border-brand-yellow bg-brand-yellow/10 p-5">
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

        {/* Próximas postagens */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" /> Próximas postagens
          </h2>
          {postagens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma postagem agendada no momento.</p>
          ) : (
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
                      {rotuloAprovacao(p.aprovacaoStatus)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Em andamento */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-base font-semibold">
            <ListChecks className="size-4 text-muted-foreground" aria-hidden="true" /> Em andamento
          </h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nada em produção no momento.</p>
          ) : (
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
          )}
        </section>

        <footer className="pt-2 text-center text-xs text-muted-foreground">
          Portal exclusivo de acompanhamento · <span className="font-semibold">Plante Comunicação</span>
        </footer>
      </main>
    </div>
  );
}
