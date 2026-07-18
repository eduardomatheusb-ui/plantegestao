import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { buscarLancamentosAno, buscarLancamentosCliente, buscarLancamentosFornecedor, paraLancRel } from "@/lib/relatorios/queries";
import { agruparDRE, fluxoMensal } from "@/lib/relatorios/calculo";
import { valorEfetivo, resumoMes } from "@/lib/financeiro/calculo";
import { MESES, TIPO_LABEL, STATUS_LABEL } from "@/lib/financeiro/constants";
import { getEmpresa } from "@/lib/empresa";
import { formatBRL, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";

export const metadata = { title: "Relatório financeiro — PDF" };

const TITULOS: Record<string, { titulo: string; sub: string }> = {
  dre: { titulo: "DEMONSTRATIVO POR COMPETÊNCIA", sub: "Receitas e despesas por categoria (DRE)" },
  "fluxo-caixa": { titulo: "FLUXO DE CAIXA", sub: "Resultado mês a mês e saldo acumulado" },
  lancamentos: { titulo: "LANÇAMENTOS", sub: "Receitas e despesas do período" },
  "por-cliente": { titulo: "MOVIMENTAÇÃO POR CLIENTE", sub: "Receitas e despesas do cliente no ano" },
  terceiros: { titulo: "MOVIMENTAÇÃO DE TERCEIROS", sub: "Movimentação financeira do fornecedor no ano" },
};

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/** Tile de resumo do topo. */
function Tile({ rotulo, valor, tom }: { rotulo: string; valor: number; tom: "receita" | "despesa" | "neutro" }) {
  const cor = tom === "receita" ? "text-emerald-700" : tom === "despesa" ? "text-red-700" : valor < 0 ? "text-red-700" : "text-[#050505]";
  return (
    <div className="rounded-md border border-neutral-200 px-3 py-2">
      <p className="text-[9px] uppercase tracking-wider text-neutral-500">{rotulo}</p>
      <p className={`font-display text-[15px] font-bold tabular-nums ${cor}`}>
        {tom === "despesa" && valor !== 0 ? "−" : valor < 0 ? "−" : ""}
        {formatBRL(Math.abs(valor))}
      </p>
    </div>
  );
}

/** Linha de categoria do DRE, com barra de participação no total. */
function LinhaCategoria({ nome, valor, total, tom }: { nome: string; valor: number; total: number; tom: "receita" | "despesa" }) {
  const pct = total > 0 ? (valor / total) * 100 : 0;
  return (
    <tr className="border-b border-neutral-100">
      <td className="py-1.5 pr-2 align-middle">{nome}</td>
      <td className="w-[34%] py-1.5 px-2 align-middle">
        <div className="h-1.5 w-full rounded-full bg-neutral-100">
          <div className={`h-1.5 rounded-full ${tom === "receita" ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.max(pct, 1.5)}%` }} />
        </div>
      </td>
      <td className="py-1.5 px-2 text-right align-middle font-medium tabular-nums">{formatBRL(valor)}</td>
      <td className="w-[9%] py-1.5 pl-2 text-right align-middle tabular-nums text-neutral-500">{pct.toFixed(1)}%</td>
    </tr>
  );
}

export default async function ImprimirRelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireModulo("relatorios", "VER");
  const sp = await searchParams;

  const rel = str(sp.rel) ?? "dre";
  const ano = Number(str(sp.ano)) || new Date().getFullYear();
  const clienteId = str(sp.cliente);
  const fornecedorId = str(sp.fornecedor);
  const meta = TITULOS[rel] ?? TITULOS.dre;

  const empresa = await getEmpresa();

  // Quem é o "recorte" do relatório (cliente ou fornecedor), quando houver.
  let recorte: string | null = null;
  if (rel === "por-cliente" && clienteId) {
    recorte = (await db.cliente.findUnique({ where: { id: clienteId }, select: { nome: true } }))?.nome ?? null;
  }
  if (rel === "terceiros" && fornecedorId) {
    recorte = (await db.fornecedor.findUnique({ where: { id: fornecedorId }, select: { nome: true } }))?.nome ?? null;
  }

  const lancs =
    rel === "por-cliente" ? (clienteId ? await buscarLancamentosCliente(clienteId, ano) : [])
    : rel === "terceiros" ? (fornecedorId ? await buscarLancamentosFornecedor(fornecedorId, ano) : [])
    : await buscarLancamentosAno(ano);

  const dre = agruparDRE(paraLancRel(lancs));
  const fluxo = fluxoMensal(paraLancRel(lancs));
  const maxBarra = Math.max(...fluxo.map((m) => Math.max(m.receitas, m.despesas)), 1);
  const resumo = resumoMes(
    lancs.map((l) => ({ tipo: l.tipo, status: l.status, valor: Number(l.valor), acrescimos: Number(l.acrescimos), descontos: Number(l.descontos) })),
  );

  const ehTabela = rel === "lancamentos" || rel === "por-cliente" || rel === "terceiros";

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`
        @page { size: A4; margin: 14mm; }
        @media print {
          .no-print { display:none !important; }
          body { background:#fff !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          thead { display: table-header-group; }
          tr { break-inside: avoid; }
          section { break-inside: avoid-page; }
        }
      `}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-12 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-11 w-auto shrink-0 object-contain" />
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">{meta.titulo}</p>
            <p className="text-sm text-neutral-500">Exercício {ano}</p>
            {recorte && <p className="text-sm font-medium">{recorte}</p>}
            <p className="text-xs text-neutral-400">Emitido em {formatDate(new Date())}</p>
          </div>
        </header>

        <p className="mt-4 text-xs text-neutral-500">{meta.sub}</p>

        {/* Resumo do topo — a leitura rápida antes do detalhe. */}
        <section className="mt-3 grid grid-cols-4 gap-2">
          <Tile rotulo="Receitas" valor={dre.totalReceitas} tom="receita" />
          <Tile rotulo="Despesas" valor={dre.totalDespesas} tom="despesa" />
          <Tile rotulo="Resultado" valor={dre.resultado} tom="neutro" />
          <Tile rotulo="Realizado (quitado)" valor={resumo.saldoRealizado} tom="neutro" />
        </section>

        {/* DRE — categorias com participação no total. */}
        {rel === "dre" && (
          <>
            <section className="mt-6">
              <h2 className="font-display text-base font-bold text-emerald-700">Receitas por categoria</h2>
              <table className="mt-2 w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-[#050505] text-left">
                    <th className="py-1.5 pr-2">Categoria</th>
                    <th className="py-1.5 px-2">Participação</th>
                    <th className="py-1.5 px-2 text-right">Valor</th>
                    <th className="py-1.5 pl-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.receitas.length === 0 ? (
                    <tr><td colSpan={4} className="py-2 text-neutral-500">Sem receitas no ano.</td></tr>
                  ) : dre.receitas.map((r) => (
                    <LinhaCategoria key={r.nome} nome={r.nome} valor={r.valor} total={dre.totalReceitas} tom="receita" />
                  ))}
                  <tr className="border-t-2 border-[#050505] font-bold">
                    <td className="py-1.5 pr-2">Total de receitas</td><td />
                    <td className="py-1.5 px-2 text-right tabular-nums text-emerald-700">{formatBRL(dre.totalReceitas)}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">100%</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mt-6">
              <h2 className="font-display text-base font-bold text-red-700">Despesas por categoria</h2>
              <table className="mt-2 w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-[#050505] text-left">
                    <th className="py-1.5 pr-2">Categoria</th>
                    <th className="py-1.5 px-2">Participação</th>
                    <th className="py-1.5 px-2 text-right">Valor</th>
                    <th className="py-1.5 pl-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dre.despesas.length === 0 ? (
                    <tr><td colSpan={4} className="py-2 text-neutral-500">Sem despesas no ano.</td></tr>
                  ) : dre.despesas.map((d) => (
                    <LinhaCategoria key={d.nome} nome={d.nome} valor={d.valor} total={dre.totalDespesas} tom="despesa" />
                  ))}
                  <tr className="border-t-2 border-[#050505] font-bold">
                    <td className="py-1.5 pr-2">Total de despesas</td><td />
                    <td className="py-1.5 px-2 text-right tabular-nums text-red-700">{formatBRL(dre.totalDespesas)}</td>
                    <td className="py-1.5 pl-2 text-right tabular-nums">100%</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mt-6 flex items-center justify-between rounded-md border-2 border-[#050505] px-4 py-3">
              <span className="font-display text-base font-bold">RESULTADO DO EXERCÍCIO</span>
              <span className={`font-display text-2xl font-bold tabular-nums ${dre.resultado < 0 ? "text-red-700" : "text-emerald-700"}`}>
                {dre.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(dre.resultado))}
              </span>
            </section>
          </>
        )}

        {/* Fluxo de caixa — gráfico de 12 meses + tabela. */}
        {rel === "fluxo-caixa" && (
          <>
            <section className="mt-6">
              <h2 className="font-display text-base font-bold">Receitas × Despesas no ano</h2>
              <div className="mt-3 flex items-end gap-1.5 border-b border-neutral-300 pb-1">
                {fluxo.map((m) => (
                  <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex h-24 w-full items-end justify-center gap-[3px]">
                      <div className="w-1/2 rounded-t-sm bg-emerald-500" style={{ height: `${(m.receitas / maxBarra) * 100}%` }} />
                      <div className="w-1/2 rounded-t-sm bg-red-500" style={{ height: `${(m.despesas / maxBarra) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5">
                {fluxo.map((m) => (
                  <p key={m.mes} className="flex-1 text-center text-[8px] uppercase text-neutral-500">{MESES[m.mes - 1]?.slice(0, 3)}</p>
                ))}
              </div>
              <p className="mt-2 flex items-center gap-4 text-[10px] text-neutral-500">
                <span className="inline-flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-emerald-500" /> Receitas</span>
                <span className="inline-flex items-center gap-1"><span className="inline-block size-2 rounded-sm bg-red-500" /> Despesas</span>
              </p>
            </section>

            <section className="mt-6">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b-2 border-[#050505] text-left">
                    <th className="py-1.5 pr-2">Mês</th>
                    <th className="py-1.5 px-2 text-right">Receitas</th>
                    <th className="py-1.5 px-2 text-right">Despesas</th>
                    <th className="py-1.5 px-2 text-right">Resultado</th>
                    <th className="py-1.5 pl-2 text-right">Saldo acumulado</th>
                  </tr>
                </thead>
                <tbody>
                  {fluxo.map((m) => (
                    <tr key={m.mes} className="border-b border-neutral-100">
                      <td className="py-1.5 pr-2 capitalize">{MESES[m.mes - 1]}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-emerald-700">{formatBRL(m.receitas)}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-red-700">{formatBRL(m.despesas)}</td>
                      <td className={`py-1.5 px-2 text-right tabular-nums ${m.resultado < 0 ? "text-red-700" : ""}`}>
                        {m.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(m.resultado))}
                      </td>
                      <td className={`py-1.5 pl-2 text-right font-medium tabular-nums ${m.saldoAcumulado < 0 ? "text-red-700" : ""}`}>
                        {m.saldoAcumulado < 0 ? "−" : ""}{formatBRL(Math.abs(m.saldoAcumulado))}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-[#050505] font-bold">
                    <td className="py-1.5 pr-2">Total do ano</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-emerald-700">{formatBRL(dre.totalReceitas)}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums text-red-700">{formatBRL(dre.totalDespesas)}</td>
                    <td className={`py-1.5 px-2 text-right tabular-nums ${dre.resultado < 0 ? "text-red-700" : ""}`}>
                      {dre.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(dre.resultado))}
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </section>
          </>
        )}

        {/* Lançamentos / por cliente / terceiros — a tabela detalhada. */}
        {ehTabela && (
          <section className="mt-6">
            <h2 className="font-display text-base font-bold">Lançamentos do período</h2>
            {lancs.length === 0 ? (
              <p className="mt-2 text-xs text-neutral-500">
                {rel === "por-cliente" && !clienteId ? "Nenhum cliente selecionado."
                  : rel === "terceiros" && !fornecedorId ? "Nenhum fornecedor selecionado."
                  : "Nenhum lançamento no período."}
              </p>
            ) : (
              <table className="mt-2 w-full border-collapse text-[11px]">
                <thead>
                  <tr className="border-b-2 border-[#050505] text-left">
                    <th className="py-1.5 pr-2">Competência</th>
                    <th className="py-1.5 px-2">Nº</th>
                    <th className="py-1.5 px-2">Título</th>
                    <th className="py-1.5 px-2">Categoria</th>
                    <th className="py-1.5 px-2">Sacado / Cedente</th>
                    <th className="py-1.5 px-2">Status</th>
                    <th className="py-1.5 pl-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {lancs.map((l) => {
                    const v = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
                    return (
                      <tr key={l.id} className="border-b border-neutral-100">
                        <td className="py-1.5 pr-2 whitespace-nowrap">{formatDate(l.dataCompetencia)}</td>
                        <td className="py-1.5 px-2 tabular-nums text-neutral-500">{l.numero}</td>
                        <td className="py-1.5 px-2">{l.titulo}</td>
                        <td className="py-1.5 px-2 text-neutral-600">{l.categoria?.nome ?? "—"}</td>
                        <td className="py-1.5 px-2 text-neutral-600">{l.cliente?.nome ?? l.fornecedor?.nome ?? "—"}</td>
                        <td className="py-1.5 px-2 text-neutral-600">{STATUS_LABEL[l.status]}</td>
                        <td className={`py-1.5 pl-2 text-right font-medium tabular-nums ${l.tipo === "RECEITA" ? "text-emerald-700" : l.tipo === "DESPESA" ? "text-red-700" : ""}`}>
                          {l.tipo === "RECEITA" ? "+" : l.tipo === "DESPESA" ? "−" : ""}{formatBRL(v)}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="border-t-2 border-[#050505] font-bold">
                    <td colSpan={6} className="py-1.5 pr-2">Resultado do período ({lancs.length} lançamento{lancs.length === 1 ? "" : "s"})</td>
                    <td className={`py-1.5 pl-2 text-right tabular-nums ${dre.resultado < 0 ? "text-red-700" : "text-emerald-700"}`}>
                      {dre.resultado < 0 ? "−" : ""}{formatBRL(Math.abs(dre.resultado))}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <p className="mt-2 text-[10px] text-neutral-500">
              Tipos: {TIPO_LABEL.RECEITA} (+), {TIPO_LABEL.DESPESA} (−). Transferências não entram no resultado.
            </p>
          </section>
        )}

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-[10px] text-neutral-400">
          {empresa.razaoSocial} · CNPJ {empresa.cnpj} · Valores por <strong>data de competência</strong>, já com
          acréscimos e descontos aplicados. &quot;Realizado&quot; considera apenas lançamentos quitados.
          Documento gerado pelo TREM em {formatDate(new Date())}.
        </footer>
      </article>
    </div>
  );
}
