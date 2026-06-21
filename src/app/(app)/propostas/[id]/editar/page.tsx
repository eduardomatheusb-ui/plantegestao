import { notFound } from "next/navigation";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { PropostaForm, type PropostaInicial } from "@/components/propostas/proposta-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditarPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePapel("GESTOR");

  const [proposta, clientes, projetos, usuarios] = await Promise.all([
    db.proposta.findUnique({ where: { id } }),
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
  ]);
  if (!proposta) notFound();

  const inicial: PropostaInicial = {
    titulo: proposta.titulo,
    clienteId: proposta.clienteId,
    projetoId: proposta.projetoId ?? "",
    responsavelId: proposta.responsavelId ?? "",
    validadeDias: String(proposta.validadeDias),
    prazo: proposta.prazo ? proposta.prazo.toISOString().slice(0, 10) : "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar proposta #${proposta.numero}`} descricao={proposta.titulo} />
      <Card>
        <CardContent className="pt-6">
          <PropostaForm id={id} inicial={inicial} clientes={clientes} projetos={projetos} usuarios={usuarios} cancelHref={`/propostas/${id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
