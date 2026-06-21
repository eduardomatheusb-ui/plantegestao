import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterOs, clientesParaOs, projetosParaOs } from "@/lib/os/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { OsForm } from "@/components/os/os-form";

function paraInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

export default async function EditarOsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("os", "EDITAR");
  const { id } = await params;
  const [os, clientes, projetos] = await Promise.all([obterOs(id), clientesParaOs(), projetosParaOs()]);
  if (!os) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ordem #${os.numero}`} descricao={os.titulo} />
      <Card>
        <CardContent className="pt-6">
          <OsForm
            id={os.id}
            clientes={clientes}
            projetos={projetos}
            cancelHref={`/os/${os.id}`}
            inicial={{
              titulo: os.titulo,
              clienteId: os.clienteId,
              projetoId: os.projetoId ?? "",
              vencimento: paraInput(os.vencimento),
              formaPagamento: os.formaPagamento ?? "",
              condicoesPagamento: os.condicoesPagamento ?? "",
              observacao: os.observacao ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
