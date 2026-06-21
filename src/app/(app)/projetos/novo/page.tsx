import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { ProjetoForm, type ProjetoInicial } from "@/components/projetos/projeto-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovoProjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ pai?: string; cliente?: string }>;
}) {
  await requirePapel("GESTOR");
  const { pai, cliente } = await searchParams;

  const [clientes, usuarios] = await Promise.all([
    listarClientesAtivos(),
    listarUsuariosAtivos(),
  ]);

  let inicial: ProjetoInicial = {};
  let projetoPaiId: string | undefined;
  if (pai) {
    const paiProjeto = await db.projeto.findUnique({
      where: { id: pai },
      select: { id: true, clienteId: true, nome: true },
    });
    if (paiProjeto) {
      projetoPaiId = paiProjeto.id;
      inicial = { clienteId: paiProjeto.clienteId };
    }
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo={projetoPaiId ? "Novo subprojeto" : "Novo projeto"}
        descricao={projetoPaiId ? "Vinculado ao projeto selecionado." : undefined}
      />
      <Card>
        <CardContent className="pt-6">
          <ProjetoForm
            id={null}
            inicial={inicial}
            clientes={clientes}
            usuarios={usuarios}
            projetoPaiId={projetoPaiId}
            cancelHref="/projetos"
          />
        </CardContent>
      </Card>
    </div>
  );
}
