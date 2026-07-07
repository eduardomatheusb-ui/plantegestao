import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterReembolso, totalAprovado } from "@/lib/reembolsos/queries";
import { getEmpresa } from "@/lib/empresa";
import { CATEGORIA_LABEL, STATUS_LABEL, rotuloCompetencia } from "@/lib/reembolsos/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";

export default async function ImprimirReembolsoPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const acesso = await acessoAtual();
  const { id } = await params;

  const r = await obterReembolso(id);
  if (!r) notFound();

  const ehFinanceiro = podeModulo(acesso.caps, "financeiro", "EDITAR");
  const ehDono = r.solicitanteId === user.id;
  if (!ehDono && !ehFinanceiro) notFound();
  if (!["APROVADO", "PROGRAMADO", "PAGO"].includes(r.status)) notFound();

  const empresa = await getEmpresa();
  const despesas = r.despesas.filter((d) => d.aprovada !== false);
  const total = totalAprovado(r.despesas);
  const cidade = empresa.endereco?.split("—").pop()?.trim() || "Betim/MG";

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 16mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
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
            <p className="font-display text-lg font-bold leading-tight">RECIBO DE REEMBOLSO</p>
            <p className="text-sm text-neutral-500">Nº {String(r.numero).padStart(4, "0")}/{r.competenciaAno}</p>
            <p className="mt-1 text-sm font-medium">{formatBRL(total)}</p>
          </div>
        </header>

        <section className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          <p className="sm:col-span-2"><span className="text-neutral-500">Colaborador:</span> {r.solicitante.nome}</p>
          <p><span className="text-neutral-500">Competência:</span> {rotuloCompetencia(r.competenciaAno, r.competenciaMes)}</p>
          <p><span className="text-neutral-500">Status:</span> {STATUS_LABEL[r.status]}</p>
          <p><span className="text-neutral-500">Solicitado em:</span> {formatDate(r.criadoEm)}</p>
          {r.analisadoEm && <p><span className="text-neutral-500">Aprovado em:</span> {formatDate(r.analisadoEm)}</p>}
          <p><span className="text-neutral-500">Pagamento previsto:</span> {formatDate(r.dataPrevistaPagamento)}</p>
          {r.dataPagamento && <p><span className="text-neutral-500">Pago em:</span> {formatDate(r.dataPagamento)}</p>}
        </section>

        <p className="mt-6 text-[13px] leading-relaxed">
          Declaro que as despesas abaixo foram realizadas por <span className="font-semibold">{r.solicitante.nome}</span> em
          atividade relacionada à operação da {empresa.marca} e foram aprovadas para reembolso conforme a política interna da agência.
        </p>

        <table className="mt-6 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b-2 border-[#050505] text-left">
              <th className="py-1.5 pr-1">Data</th>
              <th className="py-1.5 px-1">Categoria</th>
              <th className="py-1.5 px-1">Descrição</th>
              <th className="py-1.5 pl-1 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id} className="border-b border-neutral-200 align-top">
                <td className="py-2 pr-1 tabular-nums">{formatDate(d.data)}</td>
                <td className="py-2 px-1">{CATEGORIA_LABEL[d.categoria] ?? d.categoria}</td>
                <td className="py-2 px-1">{d.descricao}{d.cliente ? ` · ${d.cliente.nome}` : ""}</td>
                <td className="py-2 pl-1 text-right font-medium tabular-nums">{formatBRL(Number(d.valor))}</td>
              </tr>
            ))}
            {despesas.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-neutral-400">Sem despesas aprovadas.</td></tr>}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 border-t-2 border-[#050505] pt-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Total aprovado</span>
              <span className="font-display text-xl font-bold tabular-nums">{formatBRL(total)}</span>
            </div>
          </div>
        </div>

        {r.observacaoSolicitante && <p className="mt-6 text-xs text-neutral-600"><span className="font-semibold">Observação:</span> {r.observacaoSolicitante}</p>}

        <p className="mt-10 text-sm">{cidade}, {formatDate(r.analisadoEm ?? r.criadoEm)}.</p>

        <section className="mt-12 grid grid-cols-2 gap-12">
          <div className="text-center"><div className="border-t border-[#050505] pt-2 text-xs font-medium">{r.solicitante.nome}</div><div className="text-[11px] text-neutral-500">Colaborador</div></div>
          <div className="text-center"><div className="border-t border-[#050505] pt-2 text-xs font-medium">{r.analisadoPor?.nome ?? empresa.marca}</div><div className="text-[11px] text-neutral-500">Financeiro / aprovação</div></div>
        </section>

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Documento interno de controle — não é documento fiscal.
        </footer>
      </article>
    </div>
  );
}
