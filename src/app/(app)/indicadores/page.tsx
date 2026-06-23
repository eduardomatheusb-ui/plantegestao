import Link from "next/link";
import { Users, AlarmClock, PauseCircle, CheckCircle2, Hourglass, PenLine, Wallet, TrendingUp, Bell, FileSignature, UserX } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { carregarIndicadores } from "@/lib/indicadores/queries";
import { alertasGestao } from "@/lib/alertas/queries";
import { CLIENTE_STATUS } from "@/lib/cadastros/registry";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d)) : "—";
}
function rotuloClienteStatus(s: string) {
  return CLIENTE_STATUS.find((o) => o.value === s)?.label ?? s;
}

function Metrica({ icon: Icon, rotulo, valor, cor, sub }: { icon: typeof Users; rotulo: string; valor: React.ReactNode; cor?: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted" style={cor ? { color: cor } : undefined}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-2xl font-bold tabular-nums leading-none">{valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{rotulo}{sub ? ` · ${sub}` : ""}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function IndicadoresPage() {
  await requireModulo("relatorios", "VER");
  const [d, alertas] = await Promise.all([carregarIndicadores(), alertasGestao()]);
  const maxCarga = Math.max(1, ...d.carga.map((c) => c.total));
  const maxStatus = Math.max(1, ...d.porStatus.map((s) => s.total));
  const totalAlertas = alertas.contratosVencendo.length + alertas.clientesParados.length + alertas.jobsSemResponsavel.length;

  return (
    <div className="space-y-6">
      <PageHeader titulo="Indicadores" descricao="Visão de gestão: produção, prazos, aprovações e financeiro do mês." />

      {/* Alertas de gestão */}
      {totalAlertas > 0 && (
        <Card className="border-amber-300 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="size-4 text-amber-600" aria-hidden="true" /> Alertas ({totalAlertas})
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium"><FileSignature className="size-4 text-amber-600" aria-hidden="true" /> Contratos vencendo ({alertas.contratosVencendo.length})</p>
              {alertas.contratosVencendo.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">Nada nos próximos {alertas.diasContrato} dias.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {alertas.contratosVencendo.slice(0, 5).map((c) => (
                    <li key={c.id}><Link href={`/contratos/${c.id}`} className="hover:underline">{c.cliente}</Link> <span className="text-xs text-muted-foreground">· {dataBR(c.dataFim)}</span></li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium"><PauseCircle className="size-4 text-amber-600" aria-hidden="true" /> Clientes parados ({alertas.clientesParados.length})</p>
              {alertas.clientesParados.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">Todos com atividade recente.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {alertas.clientesParados.slice(0, 5).map((c) => (
                    <li key={c.id}><Link href={`/cadastros/clientes/${c.id}`} className="hover:underline">{c.nome}</Link></li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-[11px] text-muted-foreground">Sem job há +{alertas.diasParado} dias.</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-medium"><UserX className="size-4 text-amber-600" aria-hidden="true" /> Jobs sem responsável ({alertas.jobsSemResponsavel.length})</p>
              {alertas.jobsSemResponsavel.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">Todos com responsável.</p>
              ) : (
                <ul className="mt-1 space-y-1 text-sm">
                  {alertas.jobsSemResponsavel.slice(0, 5).map((j) => (
                    <li key={j.id}><Link href={`/jobs/${j.id}`} className="hover:underline">#{j.numero} {j.titulo}</Link> <span className="text-xs text-muted-foreground">· {j.cliente}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas-chave */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metrica icon={TrendingUp} rotulo="Jobs ativos" valor={d.totalAtivos} />
        <Metrica icon={AlarmClock} rotulo="Atrasados" valor={d.atrasadosCount} cor={d.atrasadosCount > 0 ? "#dc2626" : undefined} />
        <Metrica icon={PauseCircle} rotulo={`Parados +${d.diasParado}d`} valor={d.paradosCount} cor={d.paradosCount > 0 ? "#d97706" : undefined} />
        <Metrica icon={CheckCircle2} rotulo="Concluídos no prazo" valor={d.prazo.pct === null ? "—" : `${d.prazo.pct}%`} cor="#059669" sub={d.prazo.total ? `${d.prazo.noPrazo}/${d.prazo.total}` : undefined} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Carga por pessoa */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Users className="size-4" /> Carga por pessoa</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {d.carga.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum job ativo.</p>
            ) : (
              d.carga.map((c) => (
                <div key={c.id ?? "sem"} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="truncate">{c.nome}</span>
                    <span className="tabular-nums font-medium">{c.total}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.total / maxCarga) * 100}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Distribuição por status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Jobs por status</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {d.porStatus.map((s) => (
              <div key={s.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 truncate">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: s.cor ?? "#9ca3af" }} aria-hidden="true" />
                    {s.nome}
                  </span>
                  <span className="tabular-nums font-medium">{s.total}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(s.total / maxStatus) * 100}%`, backgroundColor: s.cor ?? "#9ca3af" }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Aprovações + financeiro */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Aprovação de peças</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><Hourglass className="size-4 text-amber-600" /> Aguardando cliente</span>
              <span className="tabular-nums font-bold">{d.aprovacao.aguardando}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><PenLine className="size-4 text-red-600" /> Ajustes solicitados</span>
              <span className="tabular-nums font-bold">{d.aprovacao.ajustes}</span>
            </div>
            <Link href="/calendario" className="block text-xs text-muted-foreground hover:underline">Ver calendário editorial →</Link>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Wallet className="size-4" /> Financeiro do mês</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Receita recebida</p><p className="text-lg font-bold tabular-nums text-emerald-600">{formatBRL(d.financeiro.receita)}</p></div>
              <div><p className="text-xs text-muted-foreground">A receber (mês)</p><p className="text-lg font-bold tabular-nums">{formatBRL(d.financeiro.aReceber)}</p></div>
              <div><p className="text-xs text-muted-foreground">Despesa paga</p><p className="text-lg font-bold tabular-nums text-red-600">{formatBRL(d.financeiro.despesa)}</p></div>
              <div><p className="text-xs text-muted-foreground">Saldo do mês</p><p className={`text-lg font-bold tabular-nums ${d.financeiro.saldo >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatBRL(d.financeiro.saldo)}</p></div>
            </div>

            {d.financeiro.meta ? (
              <div className="space-y-1.5 border-t border-border pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Meta do mês · {formatBRL(d.financeiro.meta)}</span>
                  <span className="font-semibold tabular-nums">{d.financeiro.metaPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${(d.financeiro.metaPct ?? 0) >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, d.financeiro.metaPct ?? 0)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {(d.financeiro.metaPct ?? 0) >= 100
                    ? "Meta batida! 🎉"
                    : `Faltam ${formatBRL(Math.max(0, d.financeiro.meta - d.financeiro.receita))} para a meta.`}
                </p>
              </div>
            ) : (
              <p className="border-t border-border pt-3 text-xs text-muted-foreground">
                Defina uma <Link href="/configuracoes/empresa" className="underline">meta de faturamento</Link> para acompanhar o progresso do mês.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Atrasados */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlarmClock className="size-4 text-red-600" /> Jobs atrasados</CardTitle></CardHeader>
          <CardContent>
            {d.atrasadosLista.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum job atrasado. 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {d.atrasadosLista.map((j) => (
                  <li key={j.id} className="py-2">
                    <Link href={`/jobs/${j.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="min-w-0">
                        <span className="font-medium">#{j.numero}</span> {j.titulo}
                        <span className="block truncate text-xs text-muted-foreground">{j.cliente?.nomeFantasia || j.cliente?.nome}{j.responsavel ? ` · ${j.responsavel.nome}` : ""}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium text-red-600">{dataBR(j.prazo)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Clientes por status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Clientes por situação</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {d.clientes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
            ) : (
              d.clientes.map((c) => (
                <div key={c.status} className="flex items-center justify-between text-sm">
                  <span>{rotuloClienteStatus(c.status)}</span>
                  <span className="tabular-nums font-medium">{c.total}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
