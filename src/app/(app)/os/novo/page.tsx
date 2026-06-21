import { requireModulo } from "@/lib/permissoes.server";
import { clientesParaOs, projetosParaOs } from "@/lib/os/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { OsForm } from "@/components/os/os-form";

export default async function NovaOsPage() {
  await requireModulo("os", "EDITAR");
  const [clientes, projetos] = await Promise.all([clientesParaOs(), projetosParaOs()]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova ordem de serviço" descricao="Depois de salvar, adicione os itens e emita a fatura ou o recibo." />
      <Card>
        <CardContent className="pt-6">
          <OsForm id={null} clientes={clientes} projetos={projetos} cancelHref="/os" />
        </CardContent>
      </Card>
    </div>
  );
}
