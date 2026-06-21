import { notFound } from "next/navigation";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ProjetoForm, type ProjetoInicial } from "@/components/projetos/projeto-form";
import { Card, CardContent } from "@/components/ui/card";

function dataInput(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export default async function EditarProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePapel("GESTOR");

  const [projeto, clientes, usuarios] = await Promise.all([
    db.projeto.findUnique({ where: { id } }),
    listarClientesAtivos(),
    listarUsuariosAtivos(),
  ]);
  if (!projeto) notFound();

  const inicial: ProjetoInicial = {
    nome: projeto.nome,
    clienteId: projeto.clienteId,
    responsavelId: projeto.responsavelId ?? "",
    status: projeto.status,
    prazoDesejado: dataInput(projeto.prazoDesejado),
    prazoEstimado: dataInput(projeto.prazoEstimado),
    budget: projeto.budget !== null ? String(Number(projeto.budget)) : "",
    tempoEstimadoHoras: projeto.tempoEstimadoMin ? String(projeto.tempoEstimadoMin / 60) : "",
    briefing: projeto.briefing ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar projeto #${projeto.numero}`} descricao={projeto.nome} />
      <Card>
        <CardContent className="pt-6">
          <ProjetoForm
            id={id}
            inicial={inicial}
            clientes={clientes}
            usuarios={usuarios}
            cancelHref={`/projetos/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
