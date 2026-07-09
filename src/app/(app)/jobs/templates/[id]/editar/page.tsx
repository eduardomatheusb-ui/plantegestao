import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterTemplate, opcoesTemplate } from "@/lib/templates/queries";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateForm, type TemplateInicial } from "@/components/templates/template-form";

export const dynamic = "force-dynamic";

export default async function EditarTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireModulo("jobs", "EDITAR");
  const [template, usuarios] = await Promise.all([obterTemplate(id), opcoesTemplate()]);
  if (!template) notFound();

  const inicial: TemplateInicial = {
    nome: template.nome,
    tipo: template.tipo,
    prioridade: template.prioridade,
    responsavelId: template.responsavelId ?? "",
    briefing: template.briefing ?? "",
    tarefas: template.tarefas.map((t) => ({
      descricao: t.descricao,
      responsavelId: t.responsavelId ?? "",
      prazoRelativoDias: t.prazoRelativoDias == null ? "" : String(t.prazoRelativoDias),
    })),
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar template" descricao={template.nome} />
      <TemplateForm id={id} inicial={inicial} usuarios={usuarios} cancelHref="/jobs/templates" />
    </div>
  );
}
