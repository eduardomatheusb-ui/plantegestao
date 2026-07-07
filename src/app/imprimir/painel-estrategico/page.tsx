import { requireModulo } from "@/lib/permissoes.server";
import { resolverPeriodo } from "@/lib/painel/periodo";
import { carregarPainel } from "@/lib/painel/queries";
import { formatarValor, variacaoTexto } from "@/lib/painel/formato";
import { getEmpresa } from "@/lib/empresa";
import { formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";

export const metadata = { title: "Painel Estratégico — relatório" };

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ImprimirPainelPage({
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
  const blocosParam = (str(sp.blocos) ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  const [{ blocos, geradoEm }, empresa] = await Promise.all([carregarPainel(periodo), getEmpresa()]);
  const escolhidos = blocosParam.length ? blocos.filter((b) => blocosParam.includes(b.chave)) : blocos;

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            {/* logo completo oficial da Plante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-11 w-auto shrink-0 object-contain" />
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">PAINEL ESTRATÉGICO</p>
            <p className="text-sm text-neutral-500">{periodo.label}</p>
            <p className="text-xs text-neutral-400">Emitido em {formatDate(geradoEm)}</p>
          </div>
        </header>

        {escolhidos.map((b) => (
          <section key={b.chave} className="mt-6">
            <h2 className="font-display text-base font-bold">{b.titulo}</h2>
            <p className="text-xs text-neutral-500">{b.descricao}</p>
            <table className="mt-2 w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b-2 border-[#050505] text-left">
                  <th className="py-1.5 pr-2">Indicador</th>
                  <th className="py-1.5 px-2 text-right">Valor</th>
                  <th className="py-1.5 pl-2 text-right">Variação</th>
                </tr>
              </thead>
              <tbody>
                {b.indicadores.map((i) => (
                  <tr key={i.chave} className="border-b border-neutral-200">
                    <td className="py-1.5 pr-2">{i.label}</td>
                    <td className="py-1.5 px-2 text-right font-medium tabular-nums">{formatarValor(i.valor, i.formato)}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums text-neutral-600">{variacaoTexto(i) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {b.barras && b.barras.length > 0 && (
              <table className="mt-2 w-full border-collapse text-[11px]">
                <tbody>
                  {b.barras.map((barra, idx) => (
                    <tr key={idx} className="border-b border-neutral-100">
                      <td className="py-1 pr-2">{barra.label}</td>
                      <td className="py-1 pl-2 text-right tabular-nums">{barra.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))}

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Comparação contra o período anterior de mesma duração.
          Indicadores de estado atual refletem o momento da emissão.
        </footer>
      </article>
    </div>
  );
}
