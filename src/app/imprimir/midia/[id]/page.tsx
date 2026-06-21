import { notFound } from "next/navigation";
import { requireUser } from "@/lib/rbac";
import { obterMidiaPlano } from "@/lib/midia/queries";
import { calcularTotaisMidia, subtotalLinha } from "@/lib/midia/calculo";
import { TIPO_LABEL } from "@/lib/midia/constants";
import { MESES } from "@/lib/financeiro/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo";
import { PrintButton } from "@/components/propostas/print-button";
import { getEmpresa } from "@/lib/empresa";

function Bloco({ titulo, linhas }: { titulo: string; linhas: (string | null | undefined)[] }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide">{titulo}</p>
      {linhas.filter(Boolean).map((l, i) => (
        <p key={i} className="text-xs text-neutral-600">{l}</p>
      ))}
    </div>
  );
}

export default async function ImprimirMidiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const plano = await obterMidiaPlano(id);
  if (!plano) notFound();

  const empresa = await getEmpresa();
  const diario = plano.tipo === "RADIO" || plano.tipo === "TV";
  const totalLinha = (l: (typeof plano.grades)[number]["linhas"][number]) =>
    diario ? l.insercoes.reduce((a, i) => a + i.quantidade, 0) : l.quantidade;

  const linhasCalc = plano.grades.flatMap((g) =>
    g.linhas.map((l) => ({ totalInsercoes: totalLinha(l), valorInsercao: Number(l.valorInsercao), desconto: Number(l.desconto) })),
  );
  const totais = calcularTotaisMidia(linhasCalc, Number(plano.comissaoPct), Number(plano.honorarios));
  const totalInsercoesGeral = linhasCalc.reduce((a, l) => a + l.totalInsercoes, 0);
  const pecasLabel = plano.pecas.map((p) => `${p.codigo} - ${p.nome}`).join("  ·  ");
  const forma = plano.formaPagamento ?? "Transferência";
  const c = plano.cliente;
  const v = plano.veiculo;

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 12mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-10 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        {/* Cabeçalho */}
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
            <p className="font-display text-lg font-bold leading-tight">PEDIDO DE INSERÇÃO</p>
            <p className="text-sm text-neutral-500">Nº {plano.numero}.{plano.versao}</p>
            <p className="mt-1 text-sm font-medium">{plano.titulo}</p>
          </div>
        </header>

        {/* Info */}
        <section className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
          <p><span className="text-neutral-500">Contato na Agência:</span> {plano.responsavel?.nome ?? "—"}</p>
          <p><span className="text-neutral-500">Veículo:</span> {v?.nome ?? "—"}</p>
          <p><span className="text-neutral-500">Nº Orçam.:</span> {plano.numOrcamento ?? "—"}</p>
          <p><span className="text-neutral-500">Data:</span> {formatDate(plano.criadoEm)}</p>
          <p><span className="text-neutral-500">Mídia:</span> {TIPO_LABEL[plano.tipo]}</p>
          <p className="sm:col-span-2"><span className="text-neutral-500">Anunciante:</span> {c?.nome ?? "—"}</p>
          <p><span className="text-neutral-500">Total inserções:</span> {totalInsercoesGeral}</p>
          {plano.projeto && <p><span className="text-neutral-500">Projeto:</span> #{plano.projeto.numero} {plano.projeto.nome}</p>}
          {pecasLabel && <p className="sm:col-span-4"><span className="text-neutral-500">Peças:</span> {pecasLabel}</p>}
        </section>

        {/* Grades */}
        {plano.grades.map((g) => {
          const subtotalGrade = g.linhas.reduce((a, l) => a + subtotalLinha(totalLinha(l), Number(l.valorInsercao), Number(l.desconto)), 0);
          return (
            <section key={g.id} className="mt-5">
              <p className="bg-[#050505] px-2 py-1 text-xs font-bold text-white">
                GRADE · Praça: {g.pracaNome ?? "—"} · {MESES[g.mes - 1]} {g.ano}
              </p>
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-neutral-300 text-left">
                    <th className="py-1 pr-1">Peça</th>
                    {diario ? (
                      <><th className="py-1 px-1">Programa</th><th className="py-1 px-1">Formato</th></>
                    ) : (
                      <><th className="py-1 px-1">Produto</th><th className="py-1 px-1">Local</th><th className="py-1 px-1">Período</th></>
                    )}
                    <th className="py-1 px-1 text-right">Total inser.</th>
                    <th className="py-1 px-1 text-right">Valor unit.</th>
                    <th className="py-1 px-1 text-right">Desc.</th>
                    <th className="py-1 pl-1 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {g.linhas.map((l) => {
                    const tot = totalLinha(l);
                    const sub = subtotalLinha(tot, Number(l.valorInsercao), Number(l.desconto));
                    return (
                      <tr key={l.id} className="border-b border-neutral-100 align-top">
                        <td className="py-1.5 pr-1 font-medium">{l.peca?.codigo ?? "—"}</td>
                        {diario ? (
                          <><td className="py-1.5 px-1">{l.programaNome ?? "—"}</td><td className="py-1.5 px-1">{l.formato ?? "—"}</td></>
                        ) : (
                          <>
                            <td className="py-1.5 px-1">{l.produto ?? "—"}</td>
                            <td className="py-1.5 px-1">{l.local ?? "—"}</td>
                            <td className="py-1.5 px-1 whitespace-nowrap">{formatDate(l.periodoInicio)} – {formatDate(l.periodoFim)}</td>
                          </>
                        )}
                        <td className="py-1.5 px-1 text-right tabular-nums">{tot}</td>
                        <td className="py-1.5 px-1 text-right tabular-nums">{formatBRL(Number(l.valorInsercao))}</td>
                        <td className="py-1.5 px-1 text-right tabular-nums">{Number(l.desconto) ? formatBRL(Number(l.desconto)) : "–"}</td>
                        <td className="py-1.5 pl-1 text-right font-medium tabular-nums">{formatBRL(sub)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="mt-1 text-right text-xs font-semibold">Subtotal (R$): {formatBRL(subtotalGrade)}</p>
            </section>
          );
        })}

        {/* Valores Finais */}
        <section className="mt-6 rounded-md border border-neutral-300 p-3 text-sm">
          <p className="font-bold">Valores Finais</p>
          <div className="mt-2 flex flex-wrap justify-end gap-x-8 gap-y-1 text-right">
            <p>Valor Total: <span className="font-semibold tabular-nums">{formatBRL(totais.totalMidia)}</span></p>
            <p>Comissão (R$): <span className="tabular-nums">{formatBRL(totais.comissao)}</span></p>
            <p>Valor Líquido (R$): <span className="font-semibold tabular-nums">{formatBRL(totais.valorLiquido)}</span></p>
          </div>
        </section>

        {/* Instrução de Faturamento */}
        <section className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide">Instrução de Faturamento ao Cliente</p>
          <table className="mt-1 w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-300 text-left">
                <th className="py-1 pr-1">Condição</th><th className="py-1 px-1">Vencimento</th><th className="py-1 px-1 text-right">Valor (R$)</th><th className="py-1 pl-1">Forma de pagto.</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-1.5 pr-1">Pagar à: {empresa.marca} · 1 Parcela (comissão)</td>
                <td className="py-1.5 px-1">{formatDate(plano.vencimento)}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{formatBRL(totais.comissao)}</td>
                <td className="py-1.5 pl-1">{forma}</td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-1.5 pr-1">Pagar à: {empresa.marca} · 1 Parcela (líquido ao veículo)</td>
                <td className="py-1.5 px-1">{formatDate(plano.vencimento)}</td>
                <td className="py-1.5 px-1 text-right tabular-nums">{formatBRL(totais.valorLiquido)}</td>
                <td className="py-1.5 pl-1">{forma}</td>
              </tr>
            </tbody>
          </table>
          {plano.instrucoesFaturamento && <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-600">{plano.instrucoesFaturamento}</p>}
        </section>

        {/* Dados do veículo e do cliente */}
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Bloco
            titulo={`Dados do Veículo: ${v?.nome ?? "—"}`}
            linhas={[
              v?.razaoSocial,
              v?.documento ? `CNPJ ${v.documento}` : null,
              v?.inscricaoMunicipal ? `I.M. ${v.inscricaoMunicipal}` : null,
              [v?.cep ? `CEP ${v.cep}` : null, v?.endereco].filter(Boolean).join(" / ") || null,
            ]}
          />
          <Bloco
            titulo={`Dados do Cliente: ${c?.nome ?? "—"}`}
            linhas={[
              c?.documento ? `CNPJ ${c.documento}` : null,
              c?.email ? `E-mail ${c.email}` : null,
              [c?.inscricaoEstadual ? `I.E. ${c.inscricaoEstadual}` : null, c?.inscricaoMunicipal ? `I.M. ${c.inscricaoMunicipal}` : null].filter(Boolean).join("  ") || null,
              [c?.cep ? `CEP ${c.cep}` : null, c?.endereco].filter(Boolean).join(" / ") || null,
              c?.contatoNome ? `Contato: ${c.contatoNome}` : null,
            ]}
          />
        </section>

        <div className="mt-4 text-right text-sm font-bold">Total a Pagar: {formatBRL(totais.totalMidia)}</div>

        {/* Assinaturas */}
        <section className="mt-12 grid grid-cols-3 gap-8">
          {[v?.nome ?? "Veículo", c?.nome ?? "Cliente", empresa.marca].map((nome, i) => (
            <div key={i} className="text-center">
              <div className="border-t border-[#050505] pt-2 text-xs font-medium">{nome}</div>
            </div>
          ))}
        </section>

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          *Valor de referência do desconto-padrão/comissão (remuneração da agência — item 1.11 das Normas-Padrão da Atividade Publicitária, CENP). · {empresa.razaoSocial} · CNPJ {empresa.cnpj}
        </footer>
      </article>
    </div>
  );
}
