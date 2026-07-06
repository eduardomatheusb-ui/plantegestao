import Link from "next/link";
import { Plus, Minus, ArrowLeftRight, Pencil, Trash2, Check, Undo2, BarChart3, List, Receipt, Download } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { requireModulo } from "@/lib/permissoes.server";
import { listarLancamentosMes, resumoDoMes, serieUltimosMeses } from "@/lib/financeiro/queries";
import { getEmpresa } from "@/lib/empresa";
import { quitarLancamento, estornarLancamento, excluirLancamento } from "@/lib/financeiro/actions";
import { valorEfetivo } from "@/lib/financeiro/calculo";
import { STATUS_LABEL } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { InlineAction } from "@/components/shared/inline-action";
import { MonthNav } from "@/components/financeiro/month-nav";
import { FinanceiroChart } from "@/components/financeiro/chart";
import { formatBRL, formatDate, cn } from "@/lib/utils";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function Resumo({ rotulo, valor, tom }: { rotulo: string; valor: number; tom?: "receita" | "despesa" | "saldo" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className={cn("font-display text-2xl font-bold tabular-nums", tom === "receita" && "text-success", tom === "despesa" && "text-destructive", tom === "saldo" && (valor < 0 ? "text-destructive" : "text-foreground"))}>
          {tom === "despesa" ? "−" : ""}{formatBRL(Math.abs(valor))}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function FinanceiroPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  await requireModulo("financeiro", "VER");
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const agora = new Date();
  const ano = Number(sp.ano) || agora.getFullYear();
  const mes = Number(sp.mes) || agora.getMonth() + 1;
  const view = sp.view === "grafico" ? "grafico" : "lista";

  const [lancamentos, resumo, serie, empresa] = await Promise.all([
    listarLancamentosMes(ano, mes),
    resumoDoMes(ano, mes),
    serieUltimosMeses(ano, mes, 6),
    getEmpresa(),
  ]);
  const urlEmissaoNfse = empresa.urlEmissaoNfse;

  const novoHref = (tipo: string) => `/financeiro/novo?tipo=${tipo}`;
  const toggleViewHref = `/financeiro?ano=${ano}&mes=${mes}&view=${view === "grafico" ? "lista" : "grafico"}`;

  type Lanc = (typeof lancamentos)[number];
  const sacadoDe = (l: Lanc) =>
    l.tipo === "TRANSFERENCIA"
      ? `${l.conta?.nome ?? "?"} → ${l.contaDestino?.nome ?? "?"}`
      : l.cliente?.nome ?? l.fornecedor?.nome ?? l.prestador?.nome ?? l.colaborador?.nome ?? "—";
  const relacionadoDe = (l: Lanc) =>
    l.projeto ? `Proj #${l.projeto.numero}` : l.job ? `Job #${l.job.numero}` : "—";
  const acoesDe = (l: Lanc) => (
    <div className="flex items-center justify-end gap-1">
      {l.tipo === "RECEITA" && urlEmissaoNfse && (
        <Button asChild variant="ghost" size="sm" title="Emitir nota fiscal (abre o portal de NFS-e)">
          <a href={urlEmissaoNfse} target="_blank" rel="noopener noreferrer" aria-label="Emitir nota fiscal">
            <Receipt className="size-4" />
          </a>
        </Button>
      )}
      {l.tipo !== "TRANSFERENCIA" && (
        l.status === "QUITADO" ? (
          <InlineAction action={estornarLancamento.bind(null, l.id)} title="Estornar quitação">
            <Undo2 className="size-4" />
          </InlineAction>
        ) : (
          <InlineAction action={quitarLancamento.bind(null, l.id)} title="Quitar" className="text-success">
            <Check className="size-4" />
          </InlineAction>
        )
      )}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/financeiro/${l.id}/editar`}><Pencil className="size-4" /></Link>
      </Button>
      {podeExcluir && (
        <ConfirmButton
          action={excluirLancamento.bind(null, l.id)}
          variant="ghost"
          triggerIcon={<Trash2 className="size-4" />}
          triggerLabel=""
          titulo="Excluir lançamento?"
          descricao="Esta ação não pode ser desfeita."
          confirmarLabel="Excluir"
        />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Financeiro"
        descricao="Lançamentos de receitas, despesas e transferências."
        acao={
          podeEditar ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="bg-success text-success-foreground hover:brightness-95">
                <Link href={novoHref("RECEITA")}><Plus className="size-4" />Receita</Link>
              </Button>
              <Button asChild className="bg-destructive text-destructive-foreground hover:brightness-110">
                <Link href={novoHref("DESPESA")}><Minus className="size-4" />Despesa</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={novoHref("TRANSFERENCIA")}><ArrowLeftRight className="size-4" />Transferência</Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <MonthNav ano={ano} mes={mes} />
        <div className="flex items-center gap-2">
          {view !== "grafico" && lancamentos.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <a href={`/api/financeiro/csv?ano=${ano}&mes=${mes}`} download><Download className="size-4" /> CSV</a>
            </Button>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href={toggleViewHref}>
              {view === "grafico" ? <List className="size-4" /> : <BarChart3 className="size-4" />}
              {view === "grafico" ? "Ver lista" : "Ver gráfico"}
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Resumo rotulo="Receitas (previsto)" valor={resumo.receitas} tom="receita" />
        <Resumo rotulo="Despesas (previsto)" valor={resumo.despesas} tom="despesa" />
        <Resumo rotulo="Saldo previsto" valor={resumo.saldo} tom="saldo" />
        <Resumo rotulo="Saldo realizado" valor={resumo.saldoRealizado} tom="saldo" />
      </section>

      {view === "grafico" ? (
        <Card>
          <CardContent className="pt-6">
            <FinanceiroChart serie={serie} />
          </CardContent>
        </Card>
      ) : lancamentos.length === 0 ? (
        <EmptyState
          titulo="Nenhum lançamento neste mês"
          descricao={podeEditar ? "Use os botões acima para registrar uma receita ou despesa." : undefined}
        />
      ) : (
        <>
          {/* Desktop: tabela (rola na horizontal se faltar espaço) */}
          <div className="hidden overflow-x-auto rounded-lg border border-border sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Venc.</TableHead>
                  <TableHead>Comp.</TableHead>
                  <TableHead>Pag.</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Nº / Título</TableHead>
                  <TableHead>Relacionado</TableHead>
                  <TableHead>Sacado / Cedente</TableHead>
                  <TableHead>Doc/NF</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  {podeEditar && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lancamentos.map((l) => {
                  const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
                  const quitado = l.status === "QUITADO";
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="text-sm">{formatDate(l.dataVencimento)}</TableCell>
                      <TableCell className="text-sm">{formatDate(l.dataCompetencia)}</TableCell>
                      <TableCell className="text-sm">{formatDate(l.dataPagamento)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.categoria?.nome ?? "—"}</TableCell>
                      <TableCell className="text-sm">
                        <Link href={`/financeiro/${l.id}`} className="hover:underline">
                          <span className="text-muted-foreground tabular-nums">#{l.numero}</span> {l.titulo}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{relacionadoDe(l)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{sacadoDe(l)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{l.docNf ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={quitado ? "success" : "warning"}>{STATUS_LABEL[l.status]}</Badge>
                      </TableCell>
                      <TableCell className={cn("text-right font-medium tabular-nums", l.tipo === "RECEITA" && "text-success", l.tipo === "DESPESA" && "text-destructive")}>
                        {l.tipo === "RECEITA" ? "+" : l.tipo === "DESPESA" ? "−" : ""}{formatBRL(v)}
                      </TableCell>
                      {podeEditar && <TableCell>{acoesDe(l)}</TableCell>}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Celular: cards */}
          <div className="space-y-2 sm:hidden">
            {lancamentos.map((l) => {
              const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
              const quitado = l.status === "QUITADO";
              return (
                <div key={l.id} className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/financeiro/${l.id}`} className="min-w-0 hover:underline">
                      <span className="text-xs text-muted-foreground tabular-nums">#{l.numero}</span>
                      <span className="block font-medium leading-tight">{l.titulo}</span>
                    </Link>
                    <span className={cn("shrink-0 font-bold tabular-nums", l.tipo === "RECEITA" && "text-success", l.tipo === "DESPESA" && "text-destructive")}>
                      {l.tipo === "RECEITA" ? "+" : l.tipo === "DESPESA" ? "−" : ""}{formatBRL(v)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <Badge variant={quitado ? "success" : "warning"}>{STATUS_LABEL[l.status]}</Badge>
                    <span>Venc. {formatDate(l.dataVencimento)}</span>
                    {l.categoria?.nome && <span>· {l.categoria.nome}</span>}
                    {sacadoDe(l) !== "—" && <span>· {sacadoDe(l)}</span>}
                  </div>
                  {podeEditar && <div className="border-t border-border/60 pt-1">{acoesDe(l)}</div>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
