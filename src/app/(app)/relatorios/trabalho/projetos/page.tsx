import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { relatorioProjetos } from "@/lib/relatorios/trabalho";
import { PROJETO_STATUS } from "@/lib/projetos/situacao";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";

const LABEL: Record<string, string> = Object.fromEntries(PROJETO_STATUS.map((s) => [s.value, s.label]));

function Metric({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
        <p className="font-display text-2xl font-bold tabular-nums">{valor}</p>
      </CardContent>
    </Card>
  );
}

export default async function RelProjetosPage() {
  await requireModulo("relatorios", "VER");
  const r = await relatorioProjetos();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Projetos"
        descricao="Projetos ativos por situação e por cliente."
        acao={<Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric rotulo="Projetos ativos" valor={String(r.total)} />
        <Metric rotulo="Budget total" valor={formatBRL(r.budgetTotal)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Situação</TableHead><TableHead className="text-right">Qtd.</TableHead><TableHead className="text-right">Budget</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porSituacao.map((s) => (
                <TableRow key={s.status}>
                  <TableCell className="font-medium">{LABEL[s.status] ?? s.status}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.qtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(s.budget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Projetos</TableHead><TableHead className="text-right">Budget</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porCliente.map((c) => (
                <TableRow key={c.nome}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.qtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.budget)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
