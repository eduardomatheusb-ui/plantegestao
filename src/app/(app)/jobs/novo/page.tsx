import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarStatus, listarProjetosParaSelect, listarJobsParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { JobForm, type JobInicial } from "@/components/jobs/job-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovoJobPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string; template?: string }>;
}) {
  await requireUser();
  const { projeto, cliente, template } = await searchParams;

  const [clientes, projetos, usuarios, statuses, jobs] = await Promise.all([
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarStatus(),
    listarJobsParaSelect(),
  ]);

  let inicial: JobInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  // A partir de um template: pré-preenche tipo/prioridade/responsável/briefing (as tarefas
  // são geradas ao salvar, via templateId).
  let nomeTemplate: string | null = null;
  if (template) {
    const tpl = await db.jobTemplate.findUnique({ where: { id: template }, select: { nome: true, tipo: true, prioridade: true, responsavelId: true, briefing: true } });
    if (tpl) {
      nomeTemplate = tpl.nome;
      inicial = {
        ...inicial,
        templateId: template,
        tipo: tpl.tipo,
        prioridade: tpl.prioridade,
        responsavelId: tpl.responsavelId ?? undefined,
        briefing: tpl.briefing ?? undefined,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo job" descricao={nomeTemplate ? `A partir do template “${nomeTemplate}”.` : "Uma tarefa de produção/criação."} />
      <Card>
        <CardContent className="pt-6">
          <JobForm
            id={null}
            inicial={inicial}
            clientes={clientes}
            projetos={projetos}
            usuarios={usuarios}
            statuses={statuses}
            jobs={jobs}
            cancelHref="/jobs"
          />
        </CardContent>
      </Card>
    </div>
  );
}
