import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { getEntidade, type Registro } from "@/lib/cadastros/registry";
import * as repo from "@/lib/cadastros/repo";
import { arquivarCadastro, excluirCadastro } from "@/lib/cadastros/actions";
import {
  requireUser,
  podePapel,
  CADASTRO_EDITAR_MINIMO,
  CADASTRO_EXCLUIR_MINIMO,
} from "@/lib/rbac";
import { requireModulo } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ entidade: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CadastroListaPage({ params, searchParams }: PageProps) {
  const { entidade } = await params;
  const sp = await searchParams;
  const config = getEntidade(entidade);
  if (!config) notFound();

  await requireModulo("cadastros", "VER");
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, CADASTRO_EDITAR_MINIMO);
  const podeExcluir = podePapel(user.papel, CADASTRO_EXCLUIR_MINIMO);

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const incluirArquivados = sp.arquivados === "1";
  const pageNum = typeof sp.page === "string" ? Math.max(1, parseInt(sp.page, 10) || 1) : 1;

  const { rows: rowsRaw, total, page, totalPages } = await repo.listar(config, { q, incluirArquivados, page: pageNum });
  const rows = rowsRaw as Registro[];

  const columns: Column<Registro>[] = [
    ...config.colunas.map((c) => ({
      header: c.header,
      className: c.className,
      cell: c.render,
    })),
  ];

  if (podeEditar) {
    columns.push({
      header: "",
      headClassName: "w-px",
      className: "text-right whitespace-nowrap",
      cell: (row) => {
        const arquivado = config.softDelete
          ? row[config.softDelete.field] === config.softDelete.arquivadoValue
          : false;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href={`/cadastros/${entidade}/${row.id}`}>
                <Pencil className="size-4" />
                Editar
              </Link>
            </Button>

            {config.softDelete && (
              <ConfirmButton
                action={arquivarCadastro.bind(null, entidade, row.id, !arquivado)}
                variant="ghost"
                confirmVariant={arquivado ? "default" : "destructive"}
                triggerIcon={
                  arquivado ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />
                }
                triggerLabel={arquivado ? "Reativar" : "Arquivar"}
                titulo={arquivado ? `Reativar ${config.rotulo.toLowerCase()}?` : `Arquivar ${config.rotulo.toLowerCase()}?`}
                descricao={
                  arquivado
                    ? "O registro volta a aparecer nas listas e seletores."
                    : "O registro sai das listas, mas o histórico é preservado. Você pode reativar depois."
                }
                confirmarLabel={arquivado ? "Reativar" : "Arquivar"}
              />
            )}

            {podeExcluir && (
              <ConfirmButton
                action={excluirCadastro.bind(null, entidade, row.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo={`Excluir ${config.rotulo.toLowerCase()} definitivamente?`}
                descricao="Esta ação não pode ser desfeita. Prefira arquivar, salvo se for um registro criado por engano."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        );
      },
    });
  }

  const outroFiltro = new URLSearchParams();
  if (q) outroFiltro.set("q", q);
  if (!incluirArquivados) outroFiltro.set("arquivados", "1");
  const toggleHref = `/cadastros/${entidade}?${outroFiltro.toString()}`;

  // Href de uma página mantendo busca/arquivados.
  const pageHref = (p: number) => {
    const sp2 = new URLSearchParams();
    if (q) sp2.set("q", q);
    if (incluirArquivados) sp2.set("arquivados", "1");
    if (p > 1) sp2.set("page", String(p));
    const qs = sp2.toString();
    return `/cadastros/${entidade}${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={config.rotuloPlural}
        descricao={config.descricao}
        acao={
          podeEditar ? (
            <Button asChild>
              <Link href={`/cadastros/${entidade}/novo`}>
                <Plus className="size-4" />
                Novo {config.rotulo.toLowerCase()}
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput placeholder={`Buscar ${config.rotuloPlural.toLowerCase()}…`} />
        {config.softDelete && (
          <Button asChild variant="outline" size="sm">
            <Link href={toggleHref}>
              {incluirArquivados ? "Ocultar arquivados" : "Mostrar arquivados"}
            </Link>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        rows={rows}
        vazio={
          <EmptyState
            titulo={q ? "Nenhum resultado" : `Nenhum ${config.rotulo.toLowerCase()} cadastrado`}
            descricao={
              q
                ? "Tente outro termo de busca."
                : podeEditar
                  ? `Comece criando o primeiro ${config.rotulo.toLowerCase()}.`
                  : undefined
            }
            acao={
              podeEditar && !q ? (
                <Button asChild>
                  <Link href={`/cadastros/${entidade}/novo`}>
                    <Plus className="size-4" />
                    Novo {config.rotulo.toLowerCase()}
                  </Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            Página {page} de {totalPages} · {total} {total === 1 ? "registro" : "registros"}
          </span>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" disabled={page <= 1} aria-disabled={page <= 1}>
              <Link href={pageHref(page - 1)} className={page <= 1 ? "pointer-events-none opacity-50" : ""}>Anterior</Link>
            </Button>
            <Button asChild variant="outline" size="sm" disabled={page >= totalPages} aria-disabled={page >= totalPages}>
              <Link href={pageHref(page + 1)} className={page >= totalPages ? "pointer-events-none opacity-50" : ""}>Próxima</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
