import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterLead } from "@/lib/crm/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/components/crm/lead-form";

export default async function EditarLeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("propostas", "EDITAR");
  const { id } = await params;
  const [l, usuarios] = await Promise.all([obterLead(id), listarUsuariosAtivos()]);
  if (!l) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ${l.nome}`} descricao="Atualize os dados do lead." />
      <Card>
        <CardContent className="pt-6">
          <LeadForm
            id={id}
            inicial={{
              nome: l.nome, empresa: l.empresa ?? "", origem: l.origem ?? "", email: l.email ?? "",
              telefone: l.telefone ?? "", valorEstimado: l.valorEstimado, etapa: l.etapa,
              responsavelId: l.responsavelId ?? "", observacao: l.observacao ?? "", motivoPerda: l.motivoPerda ?? "",
            }}
            usuarios={usuarios}
            cancelHref={`/crm/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
