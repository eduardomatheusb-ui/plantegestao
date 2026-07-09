import { requireModulo } from "@/lib/permissoes.server";
import { opcoesTemplate } from "@/lib/templates/queries";
import { PageHeader } from "@/components/shared/page-header";
import { TemplateForm } from "@/components/templates/template-form";

export const dynamic = "force-dynamic";

export default async function NovoTemplatePage() {
  await requireModulo("jobs", "EDITAR");
  const usuarios = await opcoesTemplate();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo template" descricao="Defina o tipo, o fluxo de tarefas e os padrões. Use depois ao criar um job." />
      <TemplateForm id={null} usuarios={usuarios} cancelHref="/jobs/templates" />
    </div>
  );
}
