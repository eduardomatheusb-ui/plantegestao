import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { requireModulo } from "@/lib/permissoes.server";
import { listarMidiaPlanos } from "@/lib/midia/queries";
import { STATUS_LABEL, STATUS_BADGE, TIPO_SIGLA, TIPO_LABEL } from "@/lib/midia/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { formatBRL, formatDate } from "@/lib/utils";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MidiaPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  await requireModulo("midia", "VER");
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const planos = await listarMidiaPlanos({ q });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mídia"
        descricao="Planos de veiculação (PI): rádio, TV, exterior, digital."
        acao={
          podeEditar ? (
            <Button asChild>
              <Link href="/midia/novo"><Plus className="size-4" />Novo plano</Link>
            </Button>
          ) : undefined
        }
      />

      <SearchInput placeholder="Buscar planos de mídia…" />

      {planos.length === 0 ? (
        <EmptyState
          titulo={q ? "Nenhum plano encontrado" : "Nenhum plano de mídia ainda"}
          descricao={q ? "Ajuste a busca." : podeEditar ? "Crie o primeiro plano de mídia." : undefined}
          acao={podeEditar && !q ? (
            <Button asChild><Link href="/midia/novo"><Plus className="size-4" />Novo plano</Link></Button>
          ) : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente / Veículo</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {planos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground tabular-nums">#{p.numero}</TableCell>
                  <TableCell>
                    <Badge variant="outline" title={TIPO_LABEL[p.tipo]}>{TIPO_SIGLA[p.tipo]}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/midia/${p.id}`} className="hover:underline">{p.titulo}</Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.cliente?.nome}
                    {p.veiculo && <span className="block text-xs">{p.veiculo.nome}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{p.responsavel?.nome ?? "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatBRL(Number(p.valorTotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
