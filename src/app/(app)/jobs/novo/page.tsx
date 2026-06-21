import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarStatus, listarProjetosParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { JobForm, type JobInicial } from "@/components/jobs/job-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovoJobPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string }>;
}) {
  await requireUser();
  const { projeto, cliente } = await searchParams;

  const [clientes, projetos, usuarios, statuses] = await Promise.all([
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarStatus(),
  ]);

  let inicial: JobInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo job" descricao="Uma tarefa de produção/criação." />
      <Card>
        <CardContent className="pt-6">
          <JobForm
            id={null}
            inicial={inicial}
            clientes={clientes}
            projetos={projetos}
            usuarios={usuarios}
            statuses={statuses}
            cancelHref="/jobs"
          />
        </CardContent>
      </Card>
    </div>
  );
}
