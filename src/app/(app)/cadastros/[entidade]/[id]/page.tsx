import { notFound } from "next/navigation";
import { getEntidade, camposSerializaveis } from "@/lib/cadastros/registry";
import { carregarOpcoesDinamicas } from "@/lib/cadastros/options";
import * as repo from "@/lib/cadastros/repo";
import { requirePapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { CrudForm } from "@/components/shared/crud-form";
import { HistoryPanel } from "@/components/shared/history-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listarOnboarding } from "@/lib/onboarding/queries";
import { listarUsuariosAtivos } from "@/lib/projetos/queries";
import { OnboardingPanel } from "@/components/onboarding/onboarding-panel";
import { PortalPanel } from "@/components/portal/portal-panel";
import { baseUrl } from "@/lib/email";

export default async function EditarCadastroPage({
  params,
}: {
  params: Promise<{ entidade: string; id: string }>;
}) {
  const { entidade, id } = await params;
  const config = getEntidade(entidade);
  if (!config) notFound();

  await requirePapel(CADASTRO_EDITAR_MINIMO);
  const { admin } = await acessoAtual();

  const record = await repo.obter(config, id);
  if (!record) notFound();

  const dynamicOptions = await carregarOpcoesDinamicas(config, id);

  // Onboarding: só para clientes.
  const ehCliente = config.model === "cliente";
  const [onboardingItens, usuariosOnboarding] = ehCliente
    ? await Promise.all([listarOnboarding(id), listarUsuariosAtivos()])
    : [[], []];

  // Monta valores iniciais serializáveis (Decimal → number, null → "").
  // Campos sensíveis (adminOnly) não saem do servidor para quem não é admin.
  const initial: Record<string, unknown> = {};
  for (const campo of config.campos) {
    if (campo.adminOnly && !admin) continue;
    const v = record[campo.name];
    if (v === null || v === undefined) initial[campo.name] = "";
    else if (campo.type === "currency" || campo.type === "number") initial[campo.name] = Number(v);
    else initial[campo.name] = v;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo={`Editar ${config.rotulo.toLowerCase()}`}
        descricao={String(record.nome ?? "")}
      />

      <Card>
        <CardContent className="pt-6">
          <CrudForm
            slug={entidade}
            id={id}
            fields={camposSerializaveis(config)}
            initial={initial}
            dynamicOptions={dynamicOptions}
            cancelHref={`/cadastros/${entidade}`}
          />
        </CardContent>
      </Card>

      {ehCliente && (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding / implantação</CardTitle>
          </CardHeader>
          <CardContent>
            <OnboardingPanel
              clienteId={id}
              status={String(record.status ?? "")}
              itens={onboardingItens}
              usuarios={usuariosOnboarding}
            />
          </CardContent>
        </Card>
      )}

      {ehCliente && (
        <Card>
          <CardHeader>
            <CardTitle>Portal do cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <PortalPanel
              clienteId={id}
              link={record.portalToken ? `${baseUrl()}/portal/${record.portalToken}` : null}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryPanel entidadeTipo={config.model} entidadeId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
