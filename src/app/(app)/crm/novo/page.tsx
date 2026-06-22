import { requireModulo } from "@/lib/permissoes.server";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { LeadForm } from "@/components/crm/lead-form";

export default async function NovoLeadPage() {
  await requireModulo("propostas", "EDITAR");
  const usuarios = await listarUsuariosAtivos();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo lead" descricao="Cadastre uma oportunidade no funil." />
      <Card>
        <CardContent className="pt-6">
          <LeadForm id={null} usuarios={usuarios} cancelHref="/crm" />
        </CardContent>
      </Card>
    </div>
  );
}
