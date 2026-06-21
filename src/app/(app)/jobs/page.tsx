import Link from "next/link";
import { Plus, Settings2 } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { listarStatus, listarJobs } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { ViewTabs } from "@/components/jobs/view-tabs";
import { JobsFilters } from "@/components/jobs/jobs-filters";
import { JobsTable } from "@/components/jobs/jobs-table";
import { KanbanColumns, type KanbanColuna } from "@/components/jobs/kanban-columns";
import { Timeline } from "@/components/jobs/timeline";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const VIEWS_VALIDAS = new Set(["minha-pauta", "lista", "kanban-status", "kanban-resp", "timeline"]);

export default async function JobsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const user = await requireUser();
  const podeGerir = podePapel(user.papel, "GESTOR");

  const view = typeof sp.view === "string" && VIEWS_VALIDAS.has(sp.view) ? sp.view : "minha-pauta";
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const statusId = typeof sp.statusId === "string" ? sp.statusId : undefined;
  const responsavelId = typeof sp.responsavelId === "string" ? sp.responsavelId : undefined;
  const clienteId = typeof sp.clienteId === "string" ? sp.clienteId : undefined;

  const [statuses, usuarios, clientes] = await Promise.all([
    listarStatus(),
    listarUsuariosAtivos(),
    listarClientesAtivos(),
  ]);

  const jobs = await listarJobs({
    q,
    statusId,
    responsavelId: view === "minha-pauta" ? undefined : responsavelId,
    minhasDoUsuario: view === "minha-pauta" ? user.id : undefined,
    clienteId,
  });

  const statusOpts = statuses.map((s) => ({ id: s.id, nome: s.nome }));

  // Colunas para os kanbans
  let colunas: KanbanColuna[] = [];
  if (view === "kanban-status") {
    colunas = statuses.map((s) => ({
      id: s.id,
      titulo: s.nome,
      cor: s.cor,
      jobs: jobs.filter((j) => j.statusId === s.id),
    }));
  } else if (view === "kanban-resp") {
    const comResp = usuarios
      .map((u) => ({ id: u.id, titulo: u.nome, jobs: jobs.filter((j) => j.responsavelId === u.id) }))
      .filter((c) => c.jobs.length > 0);
    const semResp = jobs.filter((j) => !j.responsavelId);
    colunas = [...comResp];
    if (semResp.length > 0) colunas.push({ id: "sem", titulo: "Sem responsável", jobs: semResp });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Jobs"
        descricao="A pauta de produção e criação da agência."
        acao={
          <div className="flex items-center gap-2">
            {podeGerir && (
              <Button asChild variant="outline">
                <Link href="/jobs/status">
                  <Settings2 className="size-4" />
                  Status
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/jobs/novo">
                <Plus className="size-4" />
                Novo job
              </Link>
            </Button>
          </div>
        }
      />

      <ViewTabs atual={view} />
      <JobsFilters statuses={statusOpts} responsaveis={usuarios} clientes={clientes} />

      {jobs.length === 0 ? (
        <EmptyState
          titulo={view === "minha-pauta" ? "Sua pauta está vazia" : "Nenhum job encontrado"}
          descricao={
            view === "minha-pauta"
              ? "Jobs sob sua responsabilidade aparecem aqui."
              : "Ajuste os filtros ou crie um novo job."
          }
          acao={
            <Button asChild>
              <Link href="/jobs/novo">
                <Plus className="size-4" />
                Novo job
              </Link>
            </Button>
          }
        />
      ) : view === "kanban-status" || view === "kanban-resp" ? (
        <KanbanColumns colunas={colunas} statuses={statusOpts} />
      ) : view === "timeline" ? (
        <Timeline jobs={jobs} statuses={statusOpts} />
      ) : (
        <JobsTable jobs={jobs} statuses={statusOpts} />
      )}
    </div>
  );
}
