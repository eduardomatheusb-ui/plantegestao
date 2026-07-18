import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { buscarLancamentosAno, paraLancRel } from "@/lib/relatorios/queries";
import { fluxoMensal } from "@/lib/relatorios/calculo";
import { MESES } from "@/lib/financeiro/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YearNav } from "@/components/relatorios/year-nav";
import { ExportRelatorio } from "@/components/relatorios/export-relatorio";
import { formatBRL, cn } from "@/lib/utils";

export default async function FluxoCaixaPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const ano = Number(sp.ano) || new Date().getFullYear();

  const lancs = await buscarLancamentosAno(ano);
  const fluxo = fluxoMensal(paraLancRel(lancs));

  const totalRec = fluxo.reduce((a, m) => a + m.receitas, 0);
  const totalDesp = fluxo.reduce((a, m) => a + m.despesas, 0);
  const resultado = totalRec - totalDesp;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Fluxo de Caixa"
        descricao="Resultado mês a mês e saldo acumulado no ano."
        acao={<div className="flex flex-wrap gap-2"><ExportRelatorio rel="fluxo-caixa" ano={ano} /><Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button></div>}
      />
      <YearNav ano={ano} />

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Receitas</TableHead>
                <TableHead className="text-right">Despesas</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="text-right">Saldo acumulado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fluxo.map((m) => (
                <TableRow key={m.mes}>
                  <TableCell className="capitalize">{MESES[m.mes - 1]}</TableCell>
                  <TableCell className="text-right tabular-nums text-success">{formatBRL(m.receitas)}</TableCell>
                  <TableCell className="text-right tabular-nums text-destructive">{formatBRL(m.despesas)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", m.resultado < 0 ? "text-destructive" : "")}>
                    {m.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(m.resultado))}
                  </TableCell>
                  <TableCell className={cn("text-right font-medium tabular-nums", m.saldoAcumulado < 0 ? "text-destructive" : "")}>
                    {m.saldoAcumulado < 0 ? "−" : ""}{formatBRL(Math.abs(m.saldoAcumulado))}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-semibold">
                <TableCell>Total do ano</TableCell>
                <TableCell className="text-right tabular-nums text-success">{formatBRL(totalRec)}</TableCell>
                <TableCell className="text-right tabular-nums text-destructive">{formatBRL(totalDesp)}</TableCell>
                <TableCell className={cn("text-right tabular-nums", resultado < 0 && "text-destructive")}>
                  {resultado < 0 ? "−" : ""}{formatBRL(Math.abs(resultado))}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
