import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { listarStatus, listarProjetosParaSelect } from "@/lib/jobs/queries";
import { listarUsuariosAtivos, listarClientesAtivos } from "@/lib/projetos/queries";
import { PageHeader } from "@/components/shared/page-header";
import { PostagemForm, type PostagemInicial } from "@/components/jobs/postagem-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovaPostagemPage({
  searchParams,
}: {
  searchParams: Promise<{ projeto?: string; cliente?: string }>;
}) {
  await requireUser();
  const { projeto, cliente } = await searchParams;

  const [clientes, projetos, usuarios, statuses] = await Promise.all([
    listarClientesAtivos(),
    listarProjetosParaSelect(),
    listarUsuariosAtivos(),
    listarStatus(),
  ]);

  let inicial: PostagemInicial = {};
  if (projeto) {
    const p = await db.projeto.findUnique({ where: { id: projeto }, select: { id: true, clienteId: true } });
    if (p) inicial = { clienteId: p.clienteId, projetoId: p.id };
  } else if (cliente) {
    inicial = { clienteId: cliente };
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Nova postagem" descricao="Uma arte simples de rede social — sem budget, só prazos, formato e legenda." />
      <Card>
        <CardContent className="pt-6">
          <PostagemForm id={null} inicial={inicial} clientes={clientes} projetos={projetos} usuarios={usuarios} statuses={statuses} cancelHref="/jobs" />
        </CardContent>
      </Card>
    </div>
  );
}
