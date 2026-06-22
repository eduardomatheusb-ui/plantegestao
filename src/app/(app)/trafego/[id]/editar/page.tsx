import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterCampanha } from "@/lib/trafego/queries";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CampanhaForm } from "@/components/trafego/campanha-form";

const dia = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)) : "");

export default async function EditarCampanhaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("midia", "EDITAR");
  const { id } = await params;
  const [c, clientes] = await Promise.all([obterCampanha(id), listarClientesAtivos()]);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ${c.nome}`} descricao="Atualize os dados da campanha." />
      <Card>
        <CardContent className="pt-6">
          <CampanhaForm
            id={id}
            inicial={{
              nome: c.nome, clienteId: c.clienteId, plataforma: c.plataforma,
              objetivo: c.objetivo ?? "", verba: c.verba != null ? String(c.verba) : "",
              dataInicio: dia(c.dataInicio), dataFim: dia(c.dataFim), status: c.status, observacao: c.observacao ?? "",
            }}
            clientes={clientes}
            cancelHref={`/trafego/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
