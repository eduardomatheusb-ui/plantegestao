import { requireModulo } from "@/lib/permissoes.server";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CampanhaForm } from "@/components/trafego/campanha-form";

export default async function NovaCampanhaPage() {
  await requireModulo("midia", "EDITAR");
  const clientes = await listarClientesAtivos();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova campanha" descricao="Cadastre uma campanha de tráfego pago." />
      <Card>
        <CardContent className="pt-6">
          <CampanhaForm id={null} clientes={clientes} cancelHref="/trafego" />
        </CardContent>
      </Card>
    </div>
  );
}
