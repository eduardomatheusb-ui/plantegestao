import { requireModulo } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { ComparacaoGraficaForm } from "@/components/agentes/comparacao-grafica-form";

export default async function CompararGraficasPage() {
  await requireModulo("producao", "VER");

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Comparar gráficas"
        descricao="Pesquise opções de produção gráfica a partir das especificações do material."
      />
      <ComparacaoGraficaForm />
    </div>
  );
}
