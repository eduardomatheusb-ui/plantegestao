import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { obterProposta } from "@/lib/propostas/queries";
import { formatBRL, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";
import { getEmpresa } from "@/lib/empresa";

export default async function ImprimirPropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();

  const proposta = await obterProposta(id);
  if (!proposta) notFound();

  const empresa = await getEmpresa();
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
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-6">
          <div className="flex items-start gap-3">
            {/* logo completo oficial da Plante */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-11 w-auto shrink-0 object-contain" />
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
              <p className="text-xs text-neutral-500">{empresa.email} · {empresa.telefone}</p>
              <p className="text-xs text-neutral-500">{empresa.endereco} · CEP {empresa.cep}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-2xl font-bold">PROPOSTA</p>
            <p className="text-sm text-neutral-500">Nº {proposta.numero}.{proposta.versao}</p>
          </div>
        </header>

        {/* Cliente (destinatário) */}
        <section className="mt-6 rounded-md border border-neutral-200 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">Cliente</p>
          <p className="mt-0.5 font-medium">{proposta.cliente?.nome}</p>
          <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 text-xs text-neutral-600 sm:grid-cols-2">
            {proposta.cliente?.documento && <p>CNPJ/CPF: {proposta.cliente.documento}</p>}
            {proposta.cliente?.inscricaoEstadual && <p>Inscr. estadual: {proposta.cliente.inscricaoEstadual}</p>}
            {proposta.cliente?.contatoNome && <p>Contato: {proposta.cliente.contatoNome}</p>}
            {(proposta.cliente?.email || proposta.cliente?.telefone) && <p>{[proposta.cliente?.email, proposta.cliente?.telefone].filter(Boolean).join(" · ")}</p>}
            {(proposta.cliente?.endereco || proposta.cliente?.cep) && <p className="sm:col-span-2">{[proposta.cliente?.endereco, proposta.cliente?.cep ? `CEP ${proposta.cliente.cep}` : null].filter(Boolean).join(" · ")}</p>}
          </div>
        </section>

        {/* Dados da proposta */}
        <section className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">Projeto</p>
            <p className="font-medium">{proposta.projeto ? `#${proposta.projeto.numero} ${proposta.projeto.nome}` : "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">Responsável</p>
            <p className="font-medium">{proposta.responsavel?.nome ?? "—"}</p>
          </div>
          <div className="col-span-2 text-xs text-neutral-500">
            Validade: {proposta.validadeDias} dias (até {formatDate(validadeAte)}) · Emitida em {formatDate(proposta.criadoEm)}
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

        {/* Considerações finais */}
        {proposta.consideracoesFinais && (
          <section className="mt-8">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide">Considerações finais</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{proposta.consideracoesFinais}</p>
          </section>
        )}

        {/* Assinaturas */}
        <section className="mt-16 grid grid-cols-2 gap-12">
          <div className="text-center">
            <div className="border-t border-[#050505] pt-2 text-sm font-medium">{empresa.marca}</div>
          </div>
          <div className="text-center">
            <div className="border-t border-[#050505] pt-2 text-sm font-medium">{proposta.cliente?.nome}</div>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="mt-10 border-t border-neutral-200 pt-4 text-xs text-neutral-400">
          Proposta válida por {proposta.validadeDias} dias a partir da data de emissão. · {empresa.razaoSocial} · CNPJ {empresa.cnpj}
        </footer>
      </article>
    </div>
  );
}
