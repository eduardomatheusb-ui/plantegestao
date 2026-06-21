import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { relatorioJobs } from "@/lib/relatorios/trabalho";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

export default async function RelJobsPage() {
  await requireModulo("relatorios", "VER");
  const r = await relatorioJobs();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Jobs"
        descricao="Jobs ativos por status e por responsável, com % concluído no prazo."
        acao={<Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric rotulo="Jobs ativos" valor={String(r.total)} />
        <Metric rotulo="Concluídos" valor={String(r.concluidos)} />
        <Metric rotulo="No prazo" valor={r.pctNoPrazo === null ? "—" : `${r.pctNoPrazo}%`} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Status</TableHead><TableHead className="text-right">Qtd.</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porStatus.map((s) => (
                <TableRow key={s.nome}>
                  <TableCell className="flex items-center gap-2 font-medium">
                    <span className="inline-block size-2.5 rounded-full" style={{ background: s.cor ?? "var(--border)" }} aria-hidden="true" />
                    {s.nome}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{s.qtd}</TableCell>
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
              <TableRow><TableHead>Responsável</TableHead><TableHead className="text-right">Jobs</TableHead><TableHead className="text-right">Concluídos</TableHead><TableHead className="text-right">No prazo</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porResponsavel.map((p) => (
                <TableRow key={p.nome}>
                  <TableCell className="font-medium">{p.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.qtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.concluidos}</TableCell>
                  <TableCell className="text-right tabular-nums">{p.pct === null ? "—" : `${p.pct}%`}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
