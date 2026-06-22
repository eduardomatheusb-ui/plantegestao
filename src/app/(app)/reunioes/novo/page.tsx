import { requireModulo } from "@/lib/permissoes.server";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReuniaoForm } from "@/components/reunioes/reuniao-form";

export default async function NovaReuniaoPage() {
  await requireModulo("projetos", "EDITAR");
  const clientes = await listarClientesAtivos();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova ata" descricao="Registre o que foi discutido e decidido." />
      <Card>
        <CardContent className="pt-6">
          <ReuniaoForm id={null} clientes={clientes} cancelHref="/reunioes" />
        </CardContent>
      </Card>
    </div>
  );
}
