import Link from "next/link";
import { Plus, Repeat, ClipboardList } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarContratos, resumoMrr, fichamentoAno, anosComContrato } from "@/lib/contratos/queries";
import { rotuloContratoStatus, corContratoStatus } from "@/lib/contratos/constantes";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, cn } from "@/lib/utils";

export default async function ContratosPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await requireModulo("financeiro", "VER");
  const sp = await searchParams;
  const anoSel = sp.ano ? parseInt(sp.ano, 10) : new Date().getFullYear();
  const [contratos, mrr, fich, anos] = await Promise.all([listarContratos(), resumoMrr(), fichamentoAno(anoSel), anosComContrato()]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Contratos"
        descricao="Fee recorrente (base do MRR) e serviços pontuais fechados."
        acao={<Button asChild><Link href="/contratos/novo"><Plus className="size-4" /> Novo contrato</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">MRR (receita mensal recorrente)</p><p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">{formatBRL(mrr.mrr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">ARR (anual)</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{formatBRL(mrr.arr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Contratos recorrentes ativos</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{mrr.contratosAtivos}</p></CardContent></Card>
      </div>

      {/* Fichamento anual — o que foi fechado no ano */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base"><ClipboardList className="size-4" /> Fichamento de {anoSel}</CardTitle>
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-sm">
            {anos.map((a) => (
              <Link key={a} href={`/contratos?ano=${a}`} className={cn("rounded-md px-2.5 py-1 font-medium tabular-nums", a === anoSel ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>{a}</Link>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div><p className="text-xs text-muted-foreground">Fechados no ano</p><p className="text-xl font-bold tabular-nums">{fich.qtd}</p></div>
            <div><p className="text-xs text-muted-foreground">Recorrentes</p><p className="text-xl font-bold tabular-nums">{fich.qtdRecorrente}</p></div>
            <div><p className="text-xs text-muted-foreground">MRR novo contratado</p><p className="text-xl font-bold tabular-nums text-emerald-600">{formatBRL(fich.mrrNovo)}<span className="text-xs font-normal text-muted-foreground">/mês</span></p></div>
            <div><p className="text-xs text-muted-foreground">Pontual contratado</p><p className="text-xl font-bold tabular-nums">{formatBRL(fich.pontualTotal)}</p></div>
          </div>
          {fich.porServico.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviços pontuais fechados</p>
              <ul className="divide-y divide-border rounded-md border border-border">
                {fich.porServico.map((s) => (
                  <li key={s.servico} className="flex items-center justify-between px-3 py-2 text-sm">
                    <span>{s.servico} <span className="text-xs text-muted-foreground">· {s.qtd}</span></span>
                    <span className="font-semibold tabular-nums">{formatBRL(s.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fich.qtd === 0 && <p className="text-sm text-muted-foreground">Nenhum contrato fechado em {anoSel}.</p>}
        </CardContent>
      </Card>

      {contratos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contrato ainda. Cadastre o primeiro com &quot;Novo contrato&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contratos.map((c) => (
            <Link key={c.id} href={`/contratos/${c.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{c.cliente?.nomeFantasia || c.cliente?.nome}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${corContratoStatus(c.status)}22`, color: corContratoStatus(c.status) }}>
                      {rotuloContratoStatus(c.status)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.tipo === "pontual" ? (c.servico || "Serviço pontual") : "Fee recorrente"}
                    {c.descricao ? ` · ${c.descricao}` : ""}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                    <Repeat className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {c.tipo === "pontual"
                      ? <>{formatBRL(c.valorTotal ?? 0)}<span className="text-xs font-normal text-muted-foreground"> total</span></>
                      : <>{formatBRL(c.valorMensal ?? 0)}<span className="text-xs font-normal text-muted-foreground">/mês</span></>}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
