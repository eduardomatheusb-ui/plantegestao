import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ListChecks, CheckSquare, ArrowRight } from "lucide-react";
import { obterPortal } from "@/lib/portal/queries";
import { rotuloTipoJob } from "@/lib/jobs/tipos";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Portal do cliente — Plante" };

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(d)) : "";
}
function diaCurto(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "";
}

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const dados = await obterPortal(token);
  if (!dados) notFound();

  const { cliente, jobs, postagens, aprovacoes } = dados;
  const nome = cliente.nomeFantasia || cliente.nome;

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:py-12">
      <header className="flex items-center justify-between gap-3">
        <div className="rounded-xl bg-[#050505] px-4 py-2 text-xl font-extrabold tracking-wide text-[#F7FF19]">Plante</div>
        <span className="text-sm font-medium text-muted-foreground">Portal de acompanhamento</span>
      </header>

      <div>
        <h1 className="font-display text-2xl font-bold leading-tight">{nome}</h1>
        <p className="text-sm text-muted-foreground">Acompanhe aqui o andamento dos seus trabalhos com a Plante.</p>
      </div>

      {/* Aprovações pendentes */}
      {aprovacoes.length > 0 && (
        <section className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <CheckSquare className="size-4" aria-hidden="true" /> Aguardando sua aprovação ({aprovacoes.length})
          </h2>
          <ul className="space-y-2">
            {aprovacoes.map((a) => (
              <li key={a.id}>
                <Link href={`/aprovar/${a.aprovacaoToken}`} className="flex items-center justify-between gap-2 rounded-lg bg-card p-3 text-sm font-medium shadow-sm hover:bg-muted">
                  <span className="min-w-0 truncate">{a.titulo}{a.prazoPostagem ? ` · vai ao ar ${diaCurto(a.prazoPostagem)}` : ""}</span>
                  <ArrowRight className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Próximas postagens */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" /> Próximas postagens
        </h2>
        {postagens.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma postagem agendada no momento.</p>
        ) : (
          <ul className="space-y-2">
            {postagens.map((p) => {
              const formatos = rotulosFormatos(p.formatos);
              return (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="flex size-11 shrink-0 flex-col items-center justify-center rounded-md bg-muted text-center leading-none">
                    <span className="text-sm font-bold tabular-nums">{p.prazoPostagem ? new Date(p.prazoPostagem).getDate() : "—"}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{p.prazoPostagem ? new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(p.prazoPostagem)).replace(".", "") : ""}</span>
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
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <ListChecks className="size-4" aria-hidden="true" /> Em andamento
        </h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada em produção no momento.</p>
        ) : (
          <ul className="space-y-2">
            {jobs.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
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

      <footer className="pt-4 text-center text-xs text-muted-foreground">
        Portal exclusivo · {dataBR(new Date())} · Plante Comunicação
      </footer>
    </main>
  );
}
