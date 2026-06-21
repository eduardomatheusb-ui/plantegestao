import { notFound } from "next/navigation";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarVeiculosAtivos } from "@/lib/midia/queries";
import { listarClientesAtivos, listarUsuariosAtivos } from "@/lib/projetos/queries";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { PageHeader } from "@/components/shared/page-header";
import { MidiaForm, type MidiaInicial } from "@/components/midia/midia-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function EditarMidiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePapel("GESTOR");

  const [plano, clientes, projetos, usuarios, veiculos] = await Promise.all([
    db.midiaPlano.findUnique({ where: { id } }),
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarVeiculosAtivos(),
  ]);
  if (!plano) notFound();

  const inicial: MidiaInicial = {
    tipo: plano.tipo,
    titulo: plano.titulo,
    clienteId: plano.clienteId,
    projetoId: plano.projetoId ?? "",
    responsavelId: plano.responsavelId ?? "",
    veiculoId: plano.veiculoId ?? "",
    target: plano.target ?? "",
    prazo: plano.prazo ? plano.prazo.toISOString().slice(0, 10) : "",
    contatoVeiculo: plano.contatoVeiculo ?? "",
    rede: plano.rede ?? "",
    tipoRede: plano.tipoRede ?? "",
    numOrcamento: plano.numOrcamento ?? "",
    comissaoPct: String(Number(plano.comissaoPct)),
    honorarios: String(Number(plano.honorarios)),
    bonificacao: String(Number(plano.bonificacao)),
    instrucoesFaturamento: plano.instrucoesFaturamento ?? "",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Editar plano de mídia #${plano.numero}`} descricao={plano.titulo} />
      <Card>
        <CardContent className="pt-6">
          <MidiaForm id={id} inicial={inicial} clientes={clientes} projetos={projetos} usuarios={usuarios} veiculos={veiculos} cancelHref={`/midia/${id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
