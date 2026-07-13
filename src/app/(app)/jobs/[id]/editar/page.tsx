import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarStatus, listarProjetosParaSelect, listarJobsParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { JobForm, type JobInicial } from "@/components/jobs/job-form";
import { Card, CardContent } from "@/components/ui/card";

const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditarJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const [job, clientes, projetos, usuarios, statuses, jobs] = await Promise.all([
    db.job.findUnique({ where: { id }, include: { envolvidos: { select: { usuarioId: true } } } }),
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarStatus(),
    listarJobsParaSelect(),
  ]);
  if (!job) notFound();

  const inicial: JobInicial = {
    tipo: job.tipo,
    prioridade: job.prioridade,
    titulo: job.titulo,
    clienteId: job.clienteId,
    projetoId: job.projetoId ?? "",
    responsavelId: job.responsavelId ?? "",
    statusId: job.statusId,
    prazo: dia(job.prazo),
    prazoPostagem: dia(job.prazoPostagem),
    recorrenciaFreq: job.recorrenciaFreq ?? "",
    recorrenciaProxima: dia(job.recorrenciaProxima),
    bloqueadoPorId: job.bloqueadoPorId ?? "",
    legenda: job.legenda ?? "",
    minutosGravados: job.minutosGravados ?? undefined,
    briefing: job.briefing ?? "",
    formatos: job.formatos ? job.formatos.split(",").filter(Boolean) : [],
    envolvidosIds: job.envolvidos.map((e) => e.usuarioId),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar job #${job.numero}`} descricao={job.titulo} />
      <Card>
        <CardContent className="pt-6">
          <JobForm
            id={id}
            inicial={inicial}
            clientes={clientes}
            projetos={projetos}
            usuarios={usuarios}
            statuses={statuses}
            cancelHref={`/jobs/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
