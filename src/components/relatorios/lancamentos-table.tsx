import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { valorEfetivo, resumoMes } from "@/lib/financeiro/calculo";
import { TIPO_LABEL, STATUS_LABEL } from "@/lib/financeiro/constants";
import { formatBRL, formatDate, cn } from "@/lib/utils";
import type { LancamentoTipo, LancamentoStatus } from "@prisma/client";

type Lanc = {
  id: string;
  numero: number;
  titulo: string;
  tipo: LancamentoTipo;
  status: LancamentoStatus;
  dataCompetencia: Date;
  valor: unknown;
  acrescimos: unknown;
  descontos: unknown;
  categoria?: { nome: string } | null;
  cliente?: { nome: string } | null;
  fornecedor?: { nome: string } | null;
};

export function LancamentosReportTable({ lancs }: { lancs: Lanc[] }) {
  if (lancs.length === 0) {
    return <EmptyState titulo="Nenhum lançamento no período" />;
  }

  const resumo = resumoMes(
    lancs.map((l) => ({
      tipo: l.tipo,
      status: l.status,
      valor: Number(l.valor),
      acrescimos: Number(l.acrescimos),
      descontos: Number(l.descontos),
    })),
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Resumo rotulo="Receitas (previsto)" valor={resumo.receitas} tom="receita" />
        <Resumo rotulo="Despesas (previsto)" valor={resumo.despesas} tom="despesa" />
        <Resumo rotulo="Realizado (quitado)" valor={resumo.saldoRealizado} tom="saldo" />
        <Resumo rotulo="Saldo previsto" valor={resumo.saldo} tom="saldo" />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Competência</TableHead>
              <TableHead>Nº / Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Sacado / Cedente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lancs.map((l) => {
              const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
              return (
                <TableRow key={l.id}>
                  <TableCell className="text-sm">{formatDate(l.dataCompetencia)}</TableCell>
                  <TableCell className="text-sm"><span className="text-muted-foreground tabular-nums">#{l.numero}</span> {l.titulo}</TableCell>
                  <TableCell className="text-sm">{TIPO_LABEL[l.tipo]}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.categoria?.nome ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}</TableCell>
                  <TableCell><Badge variant={l.status === "QUITADO" ? "success" : "warning"}>{STATUS_LABEL[l.status]}</Badge></TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", l.tipo === "RECEITA" && "text-success", l.tipo === "DESPESA" && "text-destructive")}>
                    {l.tipo === "RECEITA" ? "+" : l.tipo === "DESPESA" ? "−" : ""}{formatBRL(v)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Resumo({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: "receita" | "despesa" | "saldo" }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className={cn("font-display text-lg font-bold tabular-nums", tom === "receita" && "text-success", tom === "despesa" && "text-destructive", tom === "saldo" && valor < 0 && "text-destructive")}>
        {tom === "despesa" ? "−" : ""}{formatBRL(Math.abs(valor))}
      </p>
    </div>
  );
}
