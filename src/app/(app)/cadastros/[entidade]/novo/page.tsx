import { notFound } from "next/navigation";
import { getEntidade, camposSerializaveis } from "@/lib/cadastros/registry";
import { carregarOpcoesDinamicas } from "@/lib/cadastros/options";
import { requirePapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { CrudForm } from "@/components/shared/crud-form";
import { Card, CardContent } from "@/components/ui/card";

export default async function NovoCadastroPage({
  params,
}: {
  params: Promise<{ entidade: string }>;
}) {
  const { entidade } = await params;
  const config = getEntidade(entidade);
  if (!config) notFound();

  await requirePapel(CADASTRO_EDITAR_MINIMO);
  const { admin } = await acessoAtual();
  const dynamicOptions = await carregarOpcoesDinamicas(config);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo={`Novo ${config.rotulo.toLowerCase()}`} descricao={config.descricao} />
      <Card>
        <CardContent className="pt-6">
          <CrudForm
            slug={entidade}
            id={null}
            fields={camposSerializaveis(config, admin)}
            dynamicOptions={dynamicOptions}
            cancelHref={`/cadastros/${entidade}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
