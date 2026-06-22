import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterReuniao } from "@/lib/reunioes/queries";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReuniaoForm } from "@/components/reunioes/reuniao-form";

function toInput(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export default async function EditarReuniaoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("projetos", "EDITAR");
  const { id } = await params;
  const [r, clientes] = await Promise.all([obterReuniao(id), listarClientesAtivos()]);
  if (!r) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar ${r.titulo}`} descricao="Atualize a ata." />
      <Card>
        <CardContent className="pt-6">
          <ReuniaoForm
            id={id}
            inicial={{
              titulo: r.titulo, data: toInput(r.data), clienteId: r.clienteId ?? "",
              participantes: r.participantes ?? "", pauta: r.pauta ?? "",
              decisoes: r.decisoes ?? "", proximosPassos: r.proximosPassos ?? "",
            }}
            clientes={clientes}
            cancelHref={`/reunioes/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
