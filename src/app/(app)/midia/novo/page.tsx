import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarVeiculosAtivos } from "@/lib/midia/queries";
import { listarClientesAtivos, listarUsuariosAtivos } from "@/lib/projetos/queries";
import { listarProjetosParaSelect } from "@/lib/jobs/queries";
import { PageHeader } from "@/components/shared/page-header";
import { MidiaForm, type MidiaInicial } from "@/components/midia/midia-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovaMidiaPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string }>;
}) {
  await requirePapel("GESTOR");
  const { projeto, cliente } = await searchParams;

  const [clientes, projetos, usuarios, veiculos] = await Promise.all([
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarVeiculosAtivos(),
  ]);

  let inicial: MidiaInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo plano de mídia" descricao="As peças e a grade de inserções são adicionadas depois de salvar." />
      <Card>
        <CardContent className="pt-6">
          <MidiaForm id={null} inicial={inicial} clientes={clientes} projetos={projetos} usuarios={usuarios} veiculos={veiculos} cancelHref="/midia" />
        </CardContent>
      </Card>
    </div>
  );
}
