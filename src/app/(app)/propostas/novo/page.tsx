import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { PropostaForm, type PropostaInicial } from "@/components/propostas/proposta-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovaPropostaPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string }>;
}) {
  await requirePapel("GESTOR");
  const { projeto, cliente } = await searchParams;

  const [clientes, projetos, usuarios] = await Promise.all([
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
  ]);

  let inicial: PropostaInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova proposta" descricao="Os itens e a introdução são adicionados depois de salvar." />
      <Card>
        <CardContent className="pt-6">
          <PropostaForm id={null} inicial={inicial} clientes={clientes} projetos={projetos} usuarios={usuarios} cancelHref="/propostas" />
        </CardContent>
      </Card>
    </div>
  );
}
