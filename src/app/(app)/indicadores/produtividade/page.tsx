import Link from "next/link";
import { CheckCircle2, Hourglass, AlarmClock, Target, Timer, Users, Building2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { carregarProdutividade } from "@/lib/indicadores/fluxo";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PERIODOS = [
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
  { dias: 180, label: "6 meses" },
  { dias: 365, label: "12 meses" },
];

function dias1(v: number | null) {
  return v == null ? "—" : `${v.toFixed(1).replace(".", ",")} d`;
}
function pct(v: number | null) {
  return v == null ? "—" : `${v}%`;
}

function Metrica({ icon: Icon, rotulo, valor, cor }: { icon: typeof Users; rotulo: string; valor: React.ReactNode; cor?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted" style={cor ? { color: cor } : undefined}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums leading-none">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rotulo}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ProdutividadePage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  await requireModulo("relatorios", "VER");
  const sp = await searchParams;
  const dias = PERIODOS.some((p) => String(p.dias) === sp.dias) ? Number(sp.dias) : 90;
  const d = await carregarProdutividade(dias);
  const maxTipo = Math.max(1, ...d.operacao.porTipo.map((t) => t.qtd));
  const maxGargalo = Math.max(1, ...d.operacao.gargalos.map((g) => g.qtd));

  return (
    <div className="space-y-6">
      <PageHeader titulo="Produtividade e fluxo" descricao="Operação, equipe e clientes — a partir dos jobs e do fluxo de tarefas." />

      <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm">
        {PERIODOS.map((p) => (
          <Link key={p.dias} href={`/indicadores/produtividade?dias=${p.dias}`}
            className={cn("rounded-md px-3 py-1.5 font-medium", p.dias === dias ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {p.label}
          </Link>
        ))}
      </div>

      {/* Operação */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Operação</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Metrica icon={CheckCircle2} rotulo={`Concluídos (${dias}d)`} valor={d.operacao.concluidos} cor="#22c55e" />
          <Metrica icon={Hourglass} rotulo="Em andamento" valor={d.operacao.emAndamento} cor="#6366f1" />
          <Metrica icon={AlarmClock} rotulo="Atrasados" valor={d.operacao.atrasados} cor="#ef4444" />
          <Metrica icon={Target} rotulo="Concluídos no prazo" valor={pct(d.operacao.noPrazoPct)} cor="#14b8a6" />
          <Metrica icon={Timer} rotulo="Tempo médio de execução" valor={dias1(d.operacao.tempoMedioGeralDias)} cor="#f59e0b" />
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Tempo médio por tipo</CardTitle></CardHeader>
            <CardContent>
              {d.operacao.porTipo.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem jobs concluídos no período.</p>
              ) : (
                <ul className="space-y-2.5">
                  {d.operacao.porTipo.map((t) => (
                    <li key={t.tipo} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium" style={{ color: t.cor }}>{t.label}</span>
                        <span className="tabular-nums text-muted-foreground">{dias1(t.dias)} · {t.qtd} job(s)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full" style={{ width: `${(t.qtd / maxTipo) * 100}%`, backgroundColor: t.cor }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Gargalos — etapas com tarefas atrasadas</CardTitle></CardHeader>
            <CardContent>
              {d.operacao.gargalos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma etapa atrasada. 🎉</p>
              ) : (
                <ul className="space-y-2.5">
                  {d.operacao.gargalos.map((g) => (
                    <li key={g.etapa} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{g.etapa}</span>
                        <span className="tabular-nums text-destructive">{g.qtd}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted">
                        <div className="h-1.5 rounded-full bg-destructive" style={{ width: `${(g.qtd / maxGargalo) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Equipe */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><Users className="size-4" /> Equipe</h2>
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            {d.equipe.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="pb-2">Colaborador</th><th className="pb-2 text-right">Jobs ativos</th><th className="pb-2 text-right">Tarefas concluídas</th><th className="pb-2 text-right">Tarefas pendentes</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.equipe.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2 font-medium">{u.nome}</td>
                      <td className="py-2 text-right tabular-nums">{u.jobsAtivos}</td>
                      <td className="py-2 text-right tabular-nums">{u.tarefasConcluidas}</td>
                      <td className="py-2 text-right tabular-nums">{u.tarefasPendentes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Clientes */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground"><Building2 className="size-4" /> Clientes</h2>
        <Card>
          <CardContent className="overflow-x-auto pt-6">
            {d.clientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr><th className="pb-2">Cliente</th><th className="pb-2 text-right">Aprovação externa (média)</th><th className="pb-2 text-right">Revisões</th><th className="pb-2 text-right">Entregues no prazo</th><th className="pb-2 text-right">Concluídos</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {d.clientes.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2 font-medium">{c.nome}</td>
                      <td className="py-2 text-right tabular-nums">{dias1(c.aprovacaoDias)}</td>
                      <td className="py-2 text-right tabular-nums">{c.revisoes}</td>
                      <td className="py-2 text-right tabular-nums">{pct(c.noPrazoPct)}</td>
                      <td className="py-2 text-right tabular-nums">{c.concluidos}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-xs text-muted-foreground">
        “Aprovação externa (média)” é o tempo entre enviar a peça ao cliente e ele aprovar. “Revisões” conta os pedidos de ajuste no período.
        Métricas de etapa dependem do uso do fluxo de tarefas nos jobs.
      </p>
    </div>
  );
}
