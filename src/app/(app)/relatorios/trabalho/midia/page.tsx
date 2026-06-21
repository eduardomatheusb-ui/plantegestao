import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { relatorioMidia } from "@/lib/relatorios/trabalho";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";

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

export default async function RelMidiaPage() {
  await requireModulo("relatorios", "VER");
  const r = await relatorioMidia();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mídia"
        descricao="Investimento em mídia por veículo e por cliente."
        acao={<Button asChild variant="outline"><Link href="/relatorios"><ArrowLeft className="size-4" />Relatórios</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric rotulo="Planos de mídia" valor={String(r.qtd)} />
        <Metric rotulo="Total investido" valor={formatBRL(r.total)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Veículo</TableHead><TableHead className="text-right">Planos</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porVeiculo.map((v) => (
                <TableRow key={v.nome}>
                  <TableCell className="font-medium">{v.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{v.qtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(v.total)}</TableCell>
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
              <TableRow><TableHead>Cliente</TableHead><TableHead className="text-right">Planos</TableHead><TableHead className="text-right">Total</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {r.porCliente.map((c) => (
                <TableRow key={c.nome}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-right tabular-nums">{c.qtd}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(c.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
