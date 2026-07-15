import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { requireModulo, verTudoNoModulo } from "@/lib/permissoes.server";
import { listarProducao } from "@/lib/producao/queries";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/producao/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SearchInput } from "@/components/shared/search-input";
import { formatBRL, formatDate } from "@/lib/utils";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProducaoPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const acesso = await requireModulo("producao", "VER");
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const verTudo = verTudoNoModulo(acesso, "producao");
  const q = typeof sp.q === "string" ? sp.q : undefined;

  const ordens = await listarProducao({ q, soDoUsuario: verTudo ? undefined : acesso.id });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Produção"
        descricao="Ordens de produção (pedidos a fornecedores)."
        acao={podeEditar ? (
          <Button asChild><Link href="/producao/novo"><Plus className="size-4" />Nova ordem</Link></Button>
        ) : undefined}
      />
      <SearchInput placeholder="Buscar ordens de produção…" />

      {ordens.length === 0 ? (
        <EmptyState
          titulo={q ? "Nenhuma ordem encontrada" : "Nenhuma ordem de produção ainda"}
          descricao={q ? "Ajuste a busca." : podeEditar ? "Crie a primeira ordem." : undefined}
          acao={podeEditar && !q ? (<Button asChild><Link href="/producao/novo"><Plus className="size-4" />Nova ordem</Link></Button>) : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Nº</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Cliente / Fornecedor</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="text-muted-foreground tabular-nums">#{o.numero}.{o.versao}</TableCell>
                  <TableCell className="font-medium"><Link href={`/producao/${o.id}`} className="hover:underline">{o.titulo}</Link></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.cliente?.nome}
                    {o.fornecedor && <span className="block text-xs">{o.fornecedor.nome}</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(o.dataEntrega)}</TableCell>
                  <TableCell><Badge variant={STATUS_BADGE[o.status]}>{STATUS_LABEL[o.status]}</Badge></TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{formatBRL(Number(o.valorTotal))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
