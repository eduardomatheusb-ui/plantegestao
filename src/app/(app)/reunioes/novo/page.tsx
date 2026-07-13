import { requireModulo } from "@/lib/permissoes.server";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReuniaoForm } from "@/components/reunioes/reuniao-form";

export default async function NovaReuniaoPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await requireModulo("projetos", "EDITAR");
  const { cliente } = await searchParams;
  const clientes = await listarClientesAtivos();
  // Pré-seleciona o cliente quando a ata é criada a partir da Estação do Cliente.
  const clienteId = cliente && clientes.some((c) => c.id === cliente) ? cliente : undefined;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova ata" descricao="Registre o que foi discutido e decidido." />
      <Card>
        <CardContent className="pt-6">
          <ReuniaoForm id={null} inicial={clienteId ? { clienteId } : {}} clientes={clientes} cancelHref="/reunioes" />
        </CardContent>
      </Card>
    </div>
  );
}
