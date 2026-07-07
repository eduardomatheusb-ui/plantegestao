import { notFound } from "next/navigation";
import { getEntidade, camposSerializaveis } from "@/lib/cadastros/registry";
import { carregarOpcoesDinamicas } from "@/lib/cadastros/options";
import * as repo from "@/lib/cadastros/repo";
import { requirePapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { PageHeader } from "@/components/shared/page-header";
import { CrudForm } from "@/components/shared/crud-form";
import { HistoryPanel } from "@/components/shared/history-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditarCadastroPage({
  params,
}: {
  params: Promise<{ entidade: string; id: string }>;
}) {
  const { entidade, id } = await params;
  const config = getEntidade(entidade);
  if (!config) notFound();

  await requirePapel(CADASTRO_EDITAR_MINIMO);
  const acesso = await acessoAtual();
  const admin = acesso.admin;
  const podeFinanceiro = podeModulo(acesso.caps, "financeiro", "VER");

  const record = await repo.obter(config, id);
  if (!record) notFound();

  const dynamicOptions = await carregarOpcoesDinamicas(config, id);

  // Monta valores iniciais serializáveis (Decimal → number, null → "").
  // Campos sensíveis (adminOnly/financeiroOnly) não saem do servidor sem acesso.
  const initial: Record<string, unknown> = {};
  for (const campo of config.campos) {
    if (campo.adminOnly && !admin) continue;
    if (campo.financeiroOnly && !podeFinanceiro) continue;
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
            fields={camposSerializaveis(config, admin, podeFinanceiro)}
            initial={initial}
            dynamicOptions={dynamicOptions}
            cancelHref={`/cadastros/${entidade}`}
          />
        </CardContent>
      </Card>

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
