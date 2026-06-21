import { requireModulo } from "@/lib/permissoes.server";
import { getEmpresa } from "@/lib/empresa";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { EmpresaForm } from "./empresa-form";

export default async function ConfiguracaoEmpresaPage() {
  await requireModulo("admin", "ADMIN");
  const empresa = await getEmpresa();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Dados da empresa"
        descricao="Aparecem no cabeçalho e nos blocos legais das propostas, PIs de mídia e ordens de produção."
      />
      <Card>
        <CardContent className="pt-6">
          <EmpresaForm inicial={empresa} />
        </CardContent>
      </Card>
    </div>
  );
}
