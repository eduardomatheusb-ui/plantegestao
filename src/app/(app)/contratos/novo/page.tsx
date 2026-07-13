import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ContratoForm, type ContratoInicial } from "@/components/contratos/contrato-form";

export default async function NovoContratoPage({ searchParams }: { searchParams: Promise<{ proposta?: string }> }) {
  await requireModulo("financeiro", "EDITAR");
  const sp = await searchParams;
  const clientes = await listarClientesAtivos();

  // Vindo de "fechar negócio": pré-preenche a partir da proposta (contrato pontual).
  let inicial: ContratoInicial = {};
  if (sp.proposta) {
    const p = await db.proposta.findUnique({ where: { id: sp.proposta }, select: { id: true, titulo: true, clienteId: true, valorTotal: true } });
    if (p) {
      inicial = {
        clienteId: p.clienteId,
        tipo: "pontual",
        servico: p.titulo,
        valorTotal: String(Number(p.valorTotal)),
        descricao: `Serviço fechado pela proposta: ${p.titulo}`,
        propostaId: p.id,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo contrato" descricao="Fee recorrente ou serviço pontual de um cliente." />
      <Card>
        <CardContent className="pt-6">
          <ContratoForm id={null} inicial={inicial} clientes={clientes} cancelHref="/contratos" />
        </CardContent>
      </Card>
    </div>
  );
}
