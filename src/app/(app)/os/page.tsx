import Link from "next/link";
import { Plus } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { listarOs } from "@/lib/os/queries";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/os/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { formatBRL, formatDate } from "@/lib/utils";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function OsPage({ searchParams }: PageProps) {
  const acesso = await requireModulo("os", "VER");
  const podeEditar = podeModulo(acesso.caps, "os", "EDITAR");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const ordens = await listarOs({ q });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Ordens de serviço"
        descricao="Documentos emitidos ao cliente: ordens de serviço, faturas e recibos."
        acao={podeEditar && (
          <Button asChild>
            <Link href="/os/novo"><Plus className="mr-1.5 size-4" /> Nova ordem</Link>
          </Button>
        )}
      />

      <SearchInput placeholder="Buscar por título ou cliente…" />

      {ordens.length === 0 ? (
        <EmptyState titulo="Nenhuma ordem de serviço" descricao="Crie a primeira ordem de serviço para emitir faturas e recibos." />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Vencimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.map((o) => (
                <TableRow key={o.id} className="cursor-pointer">
                  <TableCell className="font-medium tabular-nums">
                    <Link href={`/os/${o.id}`} className="block">{o.numero}</Link>
                  </TableCell>
                  <TableCell><Link href={`/os/${o.id}`} className="block font-medium hover:underline">{o.titulo}</Link></TableCell>
                  <TableCell className="text-muted-foreground"><Link href={`/os/${o.id}`} className="block">{o.cliente.nome}</Link></TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[o.status]}>{STATUS_LABEL[o.status]}</Badge></TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{formatBRL(Number(o.valorTotal))}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatDate(o.vencimento)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
