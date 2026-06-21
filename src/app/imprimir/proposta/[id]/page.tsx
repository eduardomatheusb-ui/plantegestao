import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { obterProposta } from "@/lib/propostas/queries";
import { formatBRL, formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/propostas/print-button";

export default async function ImprimirPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const proposta = await obterProposta(id);
  if (!proposta) notFound();

  const itens = proposta.itens.filter((i) => i.visivel);
  const validadeAte = new Date(new Date(proposta.criadoEm).getTime() + proposta.validadeDias * 86400000);

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 16mm; }
        @media print { .no-print { display: none !important; } body { background: #fff !important; } }
      `}</style>

      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 shadow-lg print:w-full print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between border-b-4 border-[#f7ff19] pb-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-10" />
            <div>
              <p className="font-display text-xl font-bold leading-none">Plante Comunicação</p>
              <p className="text-xs text-neutral-500">Publicidade & Marketing</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold">PROPOSTA</p>
            <p className="text-sm text-neutral-500">Nº {proposta.numero}</p>
          </div>
        </header>

        {/* Dados */}
        <section className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Cliente</p>
            <p className="font-medium">{proposta.cliente?.nome}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Data</p>
            <p className="font-medium">{formatDate(proposta.criadoEm)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Responsável</p>
            <p className="font-medium">{proposta.responsavel?.nome ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Validade</p>
            <p className="font-medium">{proposta.validadeDias} dias (até {formatDate(validadeAte)})</p>
          </div>
        </section>

        <h1 className="mt-6 font-display text-2xl font-bold">{proposta.titulo}</h1>

        {/* Introdução */}
        {proposta.introducao && (
          <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{proposta.introducao}</p>
        )}

        {/* Itens */}
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[#050505] text-left">
              <th className="py-2 pr-2 font-semibold">#</th>
              <th className="py-2 pr-2 font-semibold">Item</th>
              <th className="py-2 px-2 text-right font-semibold">Valor unit.</th>
              <th className="py-2 px-2 text-right font-semibold">Qtd.</th>
              <th className="py-2 px-2 text-right font-semibold">Desc.</th>
              <th className="py-2 pl-2 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it, i) => (
              <tr key={it.id} className="border-b border-neutral-200 align-top">
                <td className="py-3 pr-2 tabular-nums">{i + 1}</td>
                <td className="py-3 pr-2">
                  <p className="font-medium">{it.nome}</p>
                  {it.descricao && <p className="text-xs text-neutral-500">{it.descricao}</p>}
                </td>
                <td className="py-3 px-2 text-right tabular-nums">{formatBRL(Number(it.valorUnit))}</td>
                <td className="py-3 px-2 text-right tabular-nums">{Number(it.quantidade)}</td>
                <td className="py-3 px-2 text-right tabular-nums">{formatBRL(Number(it.desconto))}</td>
                <td className="py-3 pl-2 text-right font-medium tabular-nums">{formatBRL(Number(it.subtotal))}</td>
              </tr>
            ))}
            {itens.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-neutral-400">Sem itens.</td></tr>
            )}
          </tbody>
        </table>

        {/* Total */}
        <div className="mt-4 flex justify-end">
          <div className="w-64 border-t-2 border-[#050505] pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-display text-xl font-bold tabular-nums">{formatBRL(Number(proposta.valorTotal))}</span>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <footer className="mt-12 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Proposta válida por {proposta.validadeDias} dias a partir da data de emissão. · Plante Comunicação · Documento gerado pelo sistema interno.
        </footer>
      </article>
    </div>
  );
}
