import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { obterProducao } from "@/lib/producao/queries";
import { formatBRL, formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/propostas/print-button";
import { getEmpresa } from "@/lib/empresa";

function Bloco({ titulo, linhas }: { titulo: string; linhas: (string | null | undefined)[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide">{titulo}</p>
      {linhas.filter(Boolean).map((l, i) => (<p key={i} className="text-xs text-neutral-600">{l}</p>))}
    </div>
  );
}

export default async function ImprimirProducaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const ordem = await obterProducao(id);
  if (!ordem) notFound();

  const empresa = await getEmpresa();
  const valorBruto = Number(ordem.valorTotal);
  const comissao = (valorBruto * Number(ordem.comissaoPct)) / 100;
  const liquido = valorBruto - comissao;
  const forma = ordem.formaPagamento ?? "Transferência";
  const c = ordem.cliente;
  const f = ordem.fornecedor;

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-10 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            <LogoMark tom="badge" className="h-11 w-auto shrink-0" />
            <div className="space-y-0.5">
              <p className="font-display text-xl font-bold leading-none">{empresa.marca}</p>
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
              <p className="text-xs text-neutral-500">{empresa.emailFinanceiro} · {empresa.telefone}</p>
              <p className="text-xs text-neutral-500">{empresa.endereco} · CEP {empresa.cep}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">PEDIDO DE PRODUÇÃO</p>
            <p className="text-sm text-neutral-500">Nº {ordem.numero}.{ordem.versao}</p>
            <p className="mt-1 text-sm font-medium">{ordem.titulo}</p>
          </div>
        </header>

        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          <p className="sm:col-span-2"><span className="text-neutral-500">Cliente:</span> {c?.nome ?? "—"}</p>
          {ordem.projeto && <p><span className="text-neutral-500">Projeto:</span> #{ordem.projeto.numero} {ordem.projeto.nome}</p>}
          <p><span className="text-neutral-500">Data:</span> {formatDate(ordem.criadoEm)}</p>
          <p className="sm:col-span-2"><span className="text-neutral-500">Fornecedor:</span> {f?.nome ?? "—"}</p>
          <p><span className="text-neutral-500">Entrega:</span> {formatDate(ordem.dataEntrega)}</p>
        </section>

        <table className="mt-5 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-[#050505] text-left">
              <th className="py-1.5 pr-1">Título</th>
              <th className="py-1.5 px-1 text-right">Quant.</th>
              <th className="py-1.5 px-1 text-right">Valor unit.</th>
              <th className="py-1.5 pl-1 text-right">Valor total</th>
            </tr>
          </thead>
          <tbody>
            {ordem.itens.map((it) => (
              <tr key={it.id} className="border-b border-neutral-200">
                <td className="py-2 pr-1 font-medium">{it.titulo}</td>
                <td className="py-2 px-1 text-right tabular-nums">{Number(it.quantidade)}</td>
                <td className="py-2 px-1 text-right tabular-nums">{formatBRL(Number(it.valorUnit))}</td>
                <td className="py-2 pl-1 text-right font-medium tabular-nums">{formatBRL(Number(it.valorTotal))}</td>
              </tr>
            ))}
            {ordem.itens.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-neutral-400">Sem itens.</td></tr>}
          </tbody>
        </table>
        <p className="mt-1 text-right text-xs font-semibold">Total (R$): {formatBRL(valorBruto)}</p>

        <section className="mt-5 rounded-md border border-neutral-300 p-3 text-sm">
          <p className="font-bold">Valores Finais</p>
          <div className="mt-2 flex flex-wrap justify-end gap-x-8 gap-y-1 text-right">
            <p>Valor bruto: <span className="font-semibold tabular-nums">{formatBRL(valorBruto)}</span></p>
            <p>Comissão (R$): <span className="tabular-nums">{formatBRL(comissao)}</span></p>
            <p>Valor Líquido (R$): <span className="font-semibold tabular-nums">{formatBRL(liquido)}</span></p>
          </div>
        </section>

        <section className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide">Instrução de Faturamento ao Fornecedor</p>
          <table className="mt-1 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-1 pr-1">Condição</th><th className="py-1 px-1">Vencimento</th><th className="py-1 px-1 text-right">Valor (R$)</th><th className="py-1 pl-1">Forma de pagto.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-1.5 pr-1">Receber de: {empresa.marca} · 1 Parcela</td>
                <td className="py-1.5 px-1">{formatDate(ordem.vencimento)}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{formatBRL(valorBruto)}</td>
                <td className="py-1.5 pl-1">{forma}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Bloco
            titulo={`Dados do Fornecedor: ${f?.nome ?? "—"}`}
            linhas={[
              f?.razaoSocial,
              f?.documento ? `CNPJ ${f.documento}` : null,
              f?.inscricaoMunicipal ? `I.M. ${f.inscricaoMunicipal}` : null,
              [f?.cep ? `CEP ${f.cep}` : null, f?.endereco].filter(Boolean).join(" / ") || null,
            ]}
          />
          <Bloco
            titulo={`Dados do Cliente: ${c?.nome ?? "—"}`}
            linhas={[
              c?.documento ? `CNPJ ${c.documento}` : null,
              c?.email ? `E-mail ${c.email}` : null,
              [c?.cep ? `CEP ${c.cep}` : null, c?.endereco].filter(Boolean).join(" / ") || null,
            ]}
          />
        </section>

        <div className="mt-3 text-xs"><span className="font-semibold">Data de Entrega:</span> {formatDate(ordem.dataEntrega)}</div>

        <section className="mt-12 grid grid-cols-3 gap-8">
          {[f?.nome ?? "Fornecedor", c?.nome ?? "Cliente", empresa.marca].map((nome, i) => (
            <div key={i} className="text-center">
              <div className="border-t border-[#050505] pt-2 text-xs font-medium">{nome}</div>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Documento gerado pelo sistema interno.
        </footer>
      </article>
    </div>
  );
}
