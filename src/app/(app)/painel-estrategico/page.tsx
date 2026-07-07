import { requireModulo } from "@/lib/permissoes.server";
import { resolverPeriodo, periodoQuery } from "@/lib/painel/periodo";
import { carregarPainel } from "@/lib/painel/queries";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodoNav } from "@/components/painel/periodo-nav";
import { ExportBarra } from "@/components/painel/export-barra";
import { BlocoCard } from "@/components/painel/bloco-card";

export const metadata = { title: "Painel Estratégico — TREM" };

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function PainelEstrategicoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModulo("admin", "ADMIN");
  const sp = await searchParams;

  const periodo = resolverPeriodo({
    periodo: str(sp.periodo), ano: str(sp.ano), mes: str(sp.mes),
    tri: str(sp.tri), de: str(sp.de), ate: str(sp.ate),
  });

  const { blocos, geradoEm } = await carregarPainel(periodo);
  const baseQuery = periodoQuery(periodo);

  const hoje = new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Painel Estratégico"
        descricao={`Indicadores de qualidade e de saúde do negócio — ${periodo.label}.`}
      />

      <PeriodoNav
        tipo={periodo.tipo}
        ano={Number(periodo.params.ano) || hoje.getFullYear()}
        mes={Number(periodo.params.mes) || hoje.getMonth() + 1}
        tri={Number(periodo.params.tri) || Math.floor(hoje.getMonth() / 3) + 1}
        de={periodo.params.de ?? ""}
        ate={periodo.params.ate ?? ""}
      />

      <ExportBarra blocos={blocos.map((b) => ({ chave: b.chave, titulo: b.titulo }))} baseQuery={baseQuery} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {blocos.map((b) => <BlocoCard key={b.chave} bloco={b} />)}
      </div>

      <p className="text-xs text-muted-foreground">
        Comparação sempre contra o período anterior de mesma duração. Indicadores de estado atual refletem o momento da consulta.
        Gerado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(geradoEm)}.
      </p>
    </div>
  );
}
