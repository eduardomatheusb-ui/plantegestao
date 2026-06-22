import Link from "next/link";
import { TrendingUp, AlertTriangle } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { saudeFinanceira } from "@/lib/saude/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { YearNav } from "@/components/relatorios/year-nav";
import { formatBRL } from "@/lib/utils";

export default async function SaudeFinanceiraPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await requireModulo("financeiro", "VER");
  const sp = await searchParams;
  const agora = new Date();
  const ano = sp.ano ? parseInt(sp.ano, 10) : agora.getFullYear();
  const d = await saudeFinanceira(ano);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Saúde financeira" descricao="MRR, margem por cliente e inadimplência." />

      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Ano {ano}</h2>
        <YearNav ano={ano} />
      </div>

      {/* MRR */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">MRR atual</p><p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">{formatBRL(d.mrr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">ARR (anual)</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{formatBRL(d.arr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Contratos ativos</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{d.contratosAtivos}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Inadimplência</p><p className={`mt-0.5 text-2xl font-bold tabular-nums ${d.inadimplencia.total > 0 ? "text-destructive" : ""}`}>{formatBRL(d.inadimplencia.total)}</p></CardContent></Card>
      </div>

      {/* Margem por cliente */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="size-4" /> Margem por cliente ({ano})</CardTitle></CardHeader>
        <CardContent>
          {d.porCliente.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem movimento financeiro por cliente neste ano.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Cliente</th>
                    <th className="py-2 pr-2 text-right font-medium">MRR</th>
                    <th className="py-2 pr-2 text-right font-medium">Receita (ano)</th>
                    <th className="py-2 pr-2 text-right font-medium">Despesa (ano)</th>
                    <th className="py-2 pr-2 text-right font-medium">Margem</th>
                    <th className="py-2 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {d.porCliente.map((c) => (
                    <tr key={c.clienteId} className="border-b border-border/60">
                      <td className="py-2 pr-2"><Link href={`/cadastros/clientes/${c.clienteId}`} className="hover:underline">{c.nome}</Link></td>
                      <td className="py-2 pr-2 text-right tabular-nums">{c.mrr > 0 ? formatBRL(c.mrr) : "—"}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-emerald-600">{formatBRL(c.receita)}</td>
                      <td className="py-2 pr-2 text-right tabular-nums text-red-600">{formatBRL(c.despesa)}</td>
                      <td className={`py-2 pr-2 text-right font-medium tabular-nums ${c.margem < 0 ? "text-red-600" : ""}`}>{formatBRL(c.margem)}</td>
                      <td className={`py-2 text-right tabular-nums ${c.margemPct != null && c.margemPct < 0 ? "text-red-600" : "text-muted-foreground"}`}>{c.margemPct != null ? `${c.margemPct}%` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">Considera lançamentos quitados do ano. Despesas sem cliente (overhead) não são rateadas.</p>
        </CardContent>
      </Card>

      {/* Inadimplência */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><AlertTriangle className="size-4 text-destructive" /> A receber vencido</CardTitle></CardHeader>
        <CardContent>
          {d.inadimplencia.itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma receita vencida em aberto. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {d.inadimplencia.itens.map((i) => (
                <li key={i.id} className="py-2">
                  <Link href={`/financeiro/${i.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                    <span className="min-w-0">
                      <span className="font-medium">#{i.numero}</span> {i.titulo}
                      <span className="block truncate text-xs text-muted-foreground">{i.nome} · {i.diasAtraso} dia(s) de atraso</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-destructive">{formatBRL(i.valor)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
