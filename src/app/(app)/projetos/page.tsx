import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { requireModulo } from "@/lib/permissoes.server";
import { listarProjetos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PROJETO_STATUS } from "@/lib/projetos/situacao";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { FiltersBar } from "@/components/projetos/filters-bar";
import { ProjetoCard } from "@/components/projetos/projeto-card";
import type { ProjetoStatus } from "@prisma/client";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_SET = new Set(PROJETO_STATUS.map((s) => s.value));

export default async function ProjetosPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  await requireModulo("projetos", "VER");
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");

  const q = typeof sp.q === "string" ? sp.q : undefined;
  const statusParam = typeof sp.status === "string" ? sp.status : undefined;
  const status = statusParam && STATUS_SET.has(statusParam as ProjetoStatus)
    ? (statusParam as ProjetoStatus)
    : undefined;
  const clienteId = typeof sp.clienteId === "string" ? sp.clienteId : undefined;
  const favoritos = sp.favoritos === "1";
  const incluirArquivados = sp.arquivados === "1";

  const [projetos, clientes] = await Promise.all([
    listarProjetos({ q, status, clienteId, favoritos, incluirArquivados, soTopLevel: true }),
    listarClientesAtivos(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Projetos"
        descricao="Cada projeto reúne jobs, propostas, mídia e financeiro de um cliente."
        acao={
          podeEditar ? (
            <Button asChild>
              <Link href="/projetos/novo">
                <Plus className="size-4" />
                Novo projeto
              </Link>
            </Button>
          ) : undefined
        }
      />

      <FiltersBar clientes={clientes} />

      {projetos.length === 0 ? (
        <EmptyState
          titulo={q ? "Nenhum projeto encontrado" : "Nenhum projeto ainda"}
          descricao={
            q
              ? "Ajuste os filtros ou o termo de busca."
              : podeEditar
                ? "Crie o primeiro projeto para começar."
                : undefined
          }
          acao={
            podeEditar && !q ? (
              <Button asChild>
                <Link href="/projetos/novo">
                  <Plus className="size-4" />
                  Novo projeto
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projetos.map((p) => (
            <ProjetoCard key={p.id} projeto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
