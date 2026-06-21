import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { listarPropostas } from "@/lib/propostas/queries";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/propostas/status";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { formatBRL, formatDate } from "@/lib/utils";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PropostasPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const propostas = await listarPropostas({ q });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Propostas"
        descricao="Orçamentos comerciais enviados aos clientes."
        acao={
          podeEditar ? (
            <Button asChild>
              <Link href="/propostas/novo">
                <Plus className="size-4" />
                Nova proposta
              </Link>
            </Button>
          ) : undefined
        }
      />

      <SearchInput placeholder="Buscar propostas…" />

      {propostas.length === 0 ? (
        <EmptyState
          titulo={q ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}
          descricao={q ? "Ajuste a busca." : podeEditar ? "Crie a primeira proposta." : undefined}
          acao={
            podeEditar && !q ? (
              <Button asChild>
                <Link href="/propostas/novo">
                  <Plus className="size-4" />
                  Nova proposta
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente / Projeto</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Criada</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {propostas.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-muted-foreground tabular-nums">#{p.numero}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/propostas/${p.id}`} className="hover:underline">{p.titulo}</Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.cliente?.nome}
                    {p.projeto && <span className="block text-xs">#{p.projeto.numero} {p.projeto.nome}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{p.responsavel?.nome ?? "—"}</TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[p.status]}>{STATUS_LABEL[p.status]}</Badge></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatBRL(Number(p.valorTotal))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(p.criadoEm)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
