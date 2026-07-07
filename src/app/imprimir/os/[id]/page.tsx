import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { obterOs } from "@/lib/os/queries";
import { getEmpresa } from "@/lib/empresa";
import { valorPorExtenso } from "@/lib/os/extenso";
import { formatBRL, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";

function Bloco({ titulo, linhas }: { titulo: string; linhas: (string | null | undefined)[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide">{titulo}</p>
      {linhas.filter(Boolean).map((l, i) => (<p key={i} className="text-xs text-neutral-600">{l}</p>))}
    </div>
  );
}

export default async function ImprimirOsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;
  await requireUser();
  const os = await obterOs(id);
  if (!os) notFound();

  const empresa = await getEmpresa();
  const total = Number(os.valorTotal);
  const c = os.cliente;
  const recibo = tipo === "recibo";
  const tituloDoc = recibo ? "RECIBO" : "FATURA DE SERVIÇO";
  const forma = os.formaPagamento ?? "Transferência";

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 16mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            {/* logo completo oficial da Plante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-11 w-auto shrink-0 object-contain" />
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
              <p className="text-xs text-neutral-500">{empresa.emailFinanceiro} · {empresa.telefone}</p>
              <p className="text-xs text-neutral-500">{empresa.endereco} · CEP {empresa.cep}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">{tituloDoc}</p>
            <p className="text-sm text-neutral-500">Nº {os.numero}</p>
            <p className="mt-1 text-sm font-medium">{formatBRL(total)}</p>
          </div>
        </header>

        {recibo ? (
          /* ───────────────── Recibo ───────────────── */
          <>
            <section className="mt-8 space-y-4 text-[15px] leading-relaxed">
              <p>
                Recebemos de <span className="font-semibold">{c.nome}</span>
                {c.documento ? <> (CNPJ/CPF {c.documento})</> : null}, a importância de{" "}
                <span className="font-semibold">{formatBRL(total)}</span>{" "}
                (<span className="capitalize">{valorPorExtenso(total)}</span>), referente a{" "}
                <span className="font-semibold">{os.titulo}</span>.
              </p>
              <p className="text-sm text-neutral-600">Forma de pagamento: {forma}.</p>
            </section>

            {os.itens.length > 0 && (
              <table className="mt-6 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b-2 border-[#050505] text-left">
                    <th className="py-1.5 pr-1">Descrição</th>
                    <th className="py-1.5 px-1 text-right">Qtd.</th>
                    <th className="py-1.5 px-1 text-right">Valor unit.</th>
                    <th className="py-1.5 pl-1 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {os.itens.map((it) => (
                    <tr key={it.id} className="border-b border-neutral-200">
                      <td className="py-2 pr-1">{it.descricao}</td>
                      <td className="py-2 px-1 text-right tabular-nums">{Number(it.quantidade)}</td>
                      <td className="py-2 px-1 text-right tabular-nums">{formatBRL(Number(it.valorUnit))}</td>
                      <td className="py-2 pl-1 text-right font-medium tabular-nums">{formatBRL(Number(it.valorTotal))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <p className="mt-10 text-sm">{empresa.endereco?.split("—").pop()?.trim() || "Betim/MG"}, {formatDate(os.dataEmissao)}.</p>

            <section className="mt-12 flex justify-center">
              <div className="w-72 text-center">
                <div className="border-t border-[#050505] pt-2 text-xs font-medium">{empresa.marca}</div>
                <div className="text-[11px] text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</div>
              </div>
            </section>
          </>
        ) : (
          /* ───────────────── Fatura de serviço ───────────────── */
          <>
            <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
              <p className="sm:col-span-2"><span className="text-neutral-500">Cliente:</span> {c.nome}</p>
              {os.projeto && <p><span className="text-neutral-500">Projeto:</span> #{os.projeto.numero} {os.projeto.nome}</p>}
              {os.fornecedor && <p><span className="text-neutral-500">Executado por:</span> {os.fornecedor.nome}</p>}
              <p><span className="text-neutral-500">Emissão:</span> {formatDate(os.dataEmissao)}</p>
              <p><span className="text-neutral-500">Vencimento:</span> {formatDate(os.vencimento)}</p>
            </section>

            <table className="mt-6 w-full border-collapse text-[11px]">
              <thead>
                <tr className="border-b-2 border-[#050505] text-left">
                  <th className="py-1.5 pr-1">Descrição do serviço</th>
                  <th className="py-1.5 px-1 text-right">Qtd.</th>
                  <th className="py-1.5 px-1 text-right">Valor unit.</th>
                  <th className="py-1.5 pl-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {os.itens.map((it) => (
                  <tr key={it.id} className="border-b border-neutral-200">
                    <td className="py-2 pr-1 font-medium">{it.descricao}</td>
                    <td className="py-2 px-1 text-right tabular-nums">{Number(it.quantidade)}</td>
                    <td className="py-2 px-1 text-right tabular-nums">{formatBRL(Number(it.valorUnit))}</td>
                    <td className="py-2 pl-1 text-right font-medium tabular-nums">{formatBRL(Number(it.valorTotal))}</td>
                  </tr>
                ))}
                {os.itens.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-neutral-400">Sem itens.</td></tr>}
              </tbody>
            </table>

            <div className="mt-4 flex justify-end">
              <div className="w-64 border-t-2 border-[#050505] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total a pagar</span>
                  <span className="font-display text-xl font-bold tabular-nums">{formatBRL(total)}</span>
                </div>
              </div>
            </div>

            <section className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-wide">Instrução de pagamento</p>
              <table className="mt-1 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-300 text-left">
                    <th className="py-1 pr-1">Pagar à</th><th className="py-1 px-1">Vencimento</th><th className="py-1 px-1 text-right">Valor (R$)</th><th className="py-1 pl-1">Forma</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-neutral-100">
                    <td className="py-1.5 pr-1">{empresa.marca}</td>
                    <td className="py-1.5 px-1">{formatDate(os.vencimento)}</td>
                    <td className="py-1.5 px-1 text-right tabular-nums">{formatBRL(total)}</td>
                    <td className="py-1.5 pl-1">{forma}</td>
                  </tr>
                </tbody>
              </table>
              {os.condicoesPagamento && <p className="mt-1 text-xs text-neutral-600">Condições: {os.condicoesPagamento}</p>}
            </section>

            <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Bloco
                titulo={`Prestador: ${empresa.marca}`}
                linhas={[empresa.razaoSocial, `CNPJ ${empresa.cnpj}`, `${empresa.endereco} · CEP ${empresa.cep}`]}
              />
              <Bloco
                titulo={`Cliente: ${c.nome}`}
                linhas={[
                  c.documento ? `CNPJ/CPF ${c.documento}` : null,
                  c.email ? `E-mail ${c.email}` : null,
                  [c.cep ? `CEP ${c.cep}` : null, c.endereco].filter(Boolean).join(" / ") || null,
                ]}
              />
            </section>

            <section className="mt-12 grid grid-cols-2 gap-12">
              <div className="text-center"><div className="border-t border-[#050505] pt-2 text-xs font-medium">{empresa.marca}</div></div>
              <div className="text-center"><div className="border-t border-[#050505] pt-2 text-xs font-medium">{c.nome}</div></div>
            </section>
          </>
        )}

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Documento gerado pelo sistema interno.
        </footer>
      </article>
    </div>
  );
}
