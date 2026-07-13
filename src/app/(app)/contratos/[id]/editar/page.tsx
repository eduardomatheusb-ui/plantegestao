import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterContrato } from "@/lib/contratos/queries";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContratoForm } from "@/components/contratos/contrato-form";

const dia = (d: Date | null) => (d ? new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(d)) : "");

export default async function EditarContratoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("financeiro", "EDITAR");
  const { id } = await params;
  const [c, clientes] = await Promise.all([obterContrato(id), listarClientesAtivos()]);
  if (!c) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Editar contrato" descricao={c.cliente?.nomeFantasia || c.cliente?.nome} />
      <Card>
        <CardContent className="pt-6">
          <ContratoForm
            id={id}
            inicial={{
              clienteId: c.clienteId, descricao: c.descricao ?? "", valorMensal: String(c.valorMensal),
              diaVencimento: c.diaVencimento != null ? String(c.diaVencimento) : "",
              dataInicio: dia(c.dataInicio), dataFim: dia(c.dataFim), status: c.status,
              reajusteEm: dia(c.reajusteEm), reajusteObs: c.reajusteObs ?? "",
            }}
            clientes={clientes}
            cancelHref={`/contratos/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
