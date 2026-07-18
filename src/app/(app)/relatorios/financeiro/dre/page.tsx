import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { buscarLancamentosAno, paraLancRel } from "@/lib/relatorios/queries";
import { agruparDRE } from "@/lib/relatorios/calculo";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { YearNav } from "@/components/relatorios/year-nav";
import { ExportRelatorio } from "@/components/relatorios/export-relatorio";
import { formatBRL, cn } from "@/lib/utils";

export default async function DREPage({ searchParams }: { searchParams: Promise<{ ano?: string }> }) {
  await requireUser();
  const sp = await searchParams;
  const ano = Number(sp.ano) || new Date().getFullYear();

  const lancs = await buscarLancamentosAno(ano);
  const dre = agruparDRE(paraLancRel(lancs));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Demonstrativo por Competência (DRE)"
        descricao="Receitas e despesas por categoria, pela data de competência."
        acao={<div className="flex flex-wrap gap-2"><ExportRelatorio rel="dre" ano={ano} /><Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button></div>}
      />
      <YearNav ano={ano} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-success">Receitas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {dre.receitas.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-muted-foreground">Sem receitas no ano.</TableCell></TableRow>
                ) : dre.receitas.map((r) => (
                  <TableRow key={r.nome}><TableCell>{r.nome}</TableCell><TableCell className="text-right tabular-nums">{formatBRL(r.valor)}</TableCell></TableRow>
                ))}
                <TableRow className="font-semibold"><TableCell>Total de receitas</TableCell><TableCell className="text-right tabular-nums text-success">{formatBRL(dre.totalReceitas)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-destructive">Despesas</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Categoria</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {dre.despesas.length === 0 ? (
                  <TableRow><TableCell colSpan={2} className="text-muted-foreground">Sem despesas no ano.</TableCell></TableRow>
                ) : dre.despesas.map((d) => (
                  <TableRow key={d.nome}><TableCell>{d.nome}</TableCell><TableCell className="text-right tabular-nums">{formatBRL(d.valor)}</TableCell></TableRow>
                ))}
                <TableRow className="font-semibold"><TableCell>Total de despesas</TableCell><TableCell className="text-right tabular-nums text-destructive">{formatBRL(dre.totalDespesas)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <span className="font-display text-lg font-semibold">Resultado do ano</span>
          <span className={cn("font-display text-2xl font-bold tabular-nums", dre.resultado < 0 ? "text-destructive" : "text-success")}>
            {dre.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(dre.resultado))}
          </span>
        </CardContent>
      </Card>
    </div>
  );
}
