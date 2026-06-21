import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { listarFornecedoresAtivos } from "@/lib/financeiro/queries";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ProducaoForm, type ProducaoInicial } from "@/components/producao/producao-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovaProducaoPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string }>;
}) {
  await requirePapel("GESTOR");
  const { projeto, cliente } = await searchParams;

  const [clientes, fornecedores, projetos] = await Promise.all([
    listarClientesAtivos(),
    listarFornecedoresAtivos(),
    listarProjetosParaSelect(),
  ]);

  let inicial: ProducaoInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova ordem de produção" descricao="Os itens são adicionados depois de salvar." />
      <Card>
        <CardContent className="pt-6">
          <ProducaoForm id={null} inicial={inicial} clientes={clientes} fornecedores={fornecedores} projetos={projetos} cancelHref="/producao" />
        </CardContent>
      </Card>
    </div>
  );
}
