import { requireModulo } from "@/lib/permissoes.server";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContratoForm } from "@/components/contratos/contrato-form";

export default async function NovoContratoPage() {
  await requireModulo("financeiro", "EDITAR");
  const clientes = await listarClientesAtivos();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo contrato" descricao="Fee recorrente de um cliente." />
      <Card>
        <CardContent className="pt-6">
          <ContratoForm id={null} clientes={clientes} cancelHref="/contratos" />
        </CardContent>
      </Card>
    </div>
  );
}
