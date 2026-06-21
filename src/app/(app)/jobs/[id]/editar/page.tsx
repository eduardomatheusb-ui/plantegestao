import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarStatus, listarProjetosParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { JobForm, type JobInicial } from "@/components/jobs/job-form";
import { PostagemForm, type PostagemInicial } from "@/components/jobs/postagem-form";
import { Card, CardContent } from "@/components/ui/card";

const dia = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditarJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const [job, clientes, projetos, usuarios, statuses] = await Promise.all([
    db.job.findUnique({ where: { id }, include: { envolvidos: { select: { usuarioId: true } } } }),
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarStatus(),
  ]);
  if (!job) notFound();

  const ehPost = job.tipo === "POSTAGEM";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ${ehPost ? "postagem" : "job"} #${job.numero}`} descricao={job.titulo} />
      <Card>
        <CardContent className="pt-6">
          {ehPost ? (
            <PostagemForm
              id={id}
              inicial={{
                titulo: job.titulo,
                clienteId: job.clienteId,
                projetoId: job.projetoId ?? "",
                responsavelId: job.responsavelId ?? "",
                statusId: job.statusId,
                prazo: dia(job.prazo),
                prazoPostagem: dia(job.prazoPostagem),
                legenda: job.legenda ?? "",
                briefing: job.briefing ?? "",
                formatos: job.formatos ? job.formatos.split(",").filter(Boolean) : [],
                envolvidosIds: job.envolvidos.map((e) => e.usuarioId),
              } satisfies PostagemInicial}
              clientes={clientes}
              projetos={projetos}
              usuarios={usuarios}
              statuses={statuses}
              cancelHref={`/jobs/${id}`}
            />
          ) : (
            <JobForm
              id={id}
              inicial={{
                titulo: job.titulo,
                clienteId: job.clienteId,
                projetoId: job.projetoId ?? "",
                responsavelId: job.responsavelId ?? "",
                statusId: job.statusId,
                prazo: dia(job.prazo),
                briefing: job.briefing ?? "",
              } satisfies JobInicial}
              clientes={clientes}
              projetos={projetos}
              usuarios={usuarios}
              statuses={statuses}
              cancelHref={`/jobs/${id}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
