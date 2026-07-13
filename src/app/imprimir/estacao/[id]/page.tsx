import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import {
  obterClienteVisao, estacaoResumo, consumoEscopo, resultadosCliente,
  financeiroCliente, planejamentoCliente, timelineRelacionamento,
} from "@/lib/clientes/queries";
import { saudeConta } from "@/lib/clientes/saude-conta";
import { getEmpresa } from "@/lib/empresa";
import { CLIENTE_STATUS } from "@/lib/cadastros/registry";
import { formatBRL, formatDate } from "@/lib/utils";
import { PrintButton } from "@/components/propostas/print-button";

export const metadata = { title: "Relatório da conta — Plante" };

function dataBR(d: Date | null | undefined) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d)) : "—";
}
function mesAno(d: Date) {
  const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(d));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const COR_SAUDE = { verde: "#10b981", amarelo: "#f59e0b", vermelho: "#ef4444" } as const;

function Bloco({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 break-inside-avoid">
      <h2 className="border-b-2 border-[#f7ff19] pb-1 font-display text-base font-bold uppercase tracking-wide">{titulo}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <p className="font-display text-xl font-bold leading-none tabular-nums">{valor}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide text-neutral-500">{rotulo}</p>
    </div>
  );
}

export default async function ImprimirEstacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("cadastros", "VER");
  const podeFinanceiro = podeModulo(acesso.caps, "financeiro", "VER");
  const { id } = await params;

  const dados = await obterClienteVisao(id);
  if (!dados) notFound();
  const { cliente: c, resumo } = dados;

  const [empresa, estacao, consumo, resultados, saude, fin, planejamento, relacionamento] = await Promise.all([
    getEmpresa(),
    estacaoResumo(id),
    consumoEscopo(id),
    resultadosCliente(id),
    saudeConta(id),
    podeFinanceiro ? financeiroCliente(id) : Promise.resolve(null),
    planejamentoCliente(id),
    timelineRelacionamento(id),
  ]);

  const nome = c.nomeFantasia || c.nome;
  const st = CLIENTE_STATUS.find((o) => o.value === c.status);
  const ck = estacao.cockpit;
  const op = resultados.operacionais;
  const dossie = (c.dossie ?? {}) as Record<string, string | null>;
  const contaDesde = estacao.contaDesde ?? c.criadoEm;
  const fmtOp = (v: number | null, sufixo = "") => (v == null ? "—" : `${v}${sufixo}`);
  const saudeMotivos = podeFinanceiro ? saude.motivos : saude.motivos.filter((m) => !m.startsWith("contrato encerra"));

  return (
    <div className="min-h-screen bg-neutral-200 py-8 text-[#050505] print:bg-white print:py-0">
      <style>{`@page { size: A4; margin: 14mm; } @media print { .no-print { display:none !important; } body { background:#fff !important; } }`}</style>
      <PrintButton />

      <article className="mx-auto w-[210mm] max-w-full bg-white p-10 text-sm shadow-lg print:w-full print:p-0 print:shadow-none">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-6 border-b-4 border-[#f7ff19] pb-5">
          <div className="flex items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-preto.svg" alt="Plante Comunicação" className="h-11 w-auto shrink-0 object-contain" />
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-500">{empresa.razaoSocial} · CNPJ {empresa.cnpj}</p>
              <p className="text-xs text-neutral-500">{empresa.email} · {empresa.telefone}</p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold leading-tight">RELATÓRIO DA CONTA</p>
            <p className="text-sm text-neutral-500">Visão macro · {dataBR(new Date())}</p>
          </div>
        </header>

        {/* Identificação */}
        <section className="mt-6 flex items-center gap-4">
          {c.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.logoUrl} alt={nome} className="size-14 shrink-0 rounded-xl border border-neutral-200 bg-white object-contain p-1" />
          ) : null}
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold leading-tight">{nome}</h1>
            <p className="text-neutral-500">
              {st?.label ?? c.status} · conta desde {mesAno(contaDesde)}
              {c.atendimento ? ` · Atendimento: ${c.atendimento.nome}` : ""}
              {c.estrategia ? ` · Estratégia: ${c.estrategia.nome}` : ""}
            </p>
          </div>
        </section>

        {/* Saúde */}
        <Bloco titulo="Saúde da conta">
          <p className="flex items-center gap-2 font-semibold">
            <span className="inline-flex size-3 rounded-full" style={{ background: COR_SAUDE[saude.cor] }} aria-hidden="true" />
            {saude.rotulo}
          </p>
          <p className="mt-1 text-neutral-600">
            {saudeMotivos.length > 0 ? `${saudeMotivos.join(" · ")}.` : "Nenhum ponto de atenção nos últimos 90 dias."}
          </p>
        </Bloco>

        {/* Panorama */}
        <Bloco titulo="Panorama agora">
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <Metrica rotulo="Demandas abertas" valor={ck.abertas} />
            <Metrica rotulo="Atrasadas" valor={<span style={ck.atrasadas > 0 ? { color: "#dc2626" } : undefined}>{ck.atrasadas}</span>} />
            <Metrica rotulo="Aguardando cliente" valor={ck.aguardandoCliente} />
            <Metrica rotulo="Ajustes solicitados" valor={ck.ajustes} />
            <Metrica rotulo="Entregas da semana" valor={ck.entregasSemana} />
            <Metrica rotulo="Programados" valor={ck.programados} />
            <Metrica rotulo="Campanhas ativas" valor={ck.campanhasAtivas} />
            <Metrica rotulo="Próxima entrega" valor={estacao.proximaEntrega ? dataBR(estacao.proximaEntrega.prazo) : "—"} />
          </div>
        </Bloco>

        {/* Consumo do escopo */}
        {consumo.length > 0 && (
          <Bloco titulo="Consumo do escopo — este mês">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="py-1.5 pr-2 font-medium">Entregável</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Contratado</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Utilizado</th>
                  <th className="py-1.5 text-right font-medium">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {consumo.map((item) => (
                  <tr key={item.id} className="border-b border-neutral-100">
                    <td className="py-1.5 pr-2">{item.rotulo}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{item.contratado}{item.unidade === "horas" ? "h" : ""}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{item.utilizado == null ? "—" : `${item.utilizado}${item.unidade === "horas" ? "h" : ""}`}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums" style={item.saldo != null && item.saldo < 0 ? { color: "#dc2626" } : undefined}>
                      {item.saldo == null ? "—" : `${item.saldo}${item.unidade === "horas" ? "h" : ""}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Bloco>
        )}

        {/* Indicadores 90d */}
        <Bloco titulo={`Indicadores operacionais — últimos ${resultados.janelaDias} dias`}>
          <div className="grid grid-cols-4 gap-x-6 gap-y-4">
            <Metrica rotulo="Entregas no prazo" valor={fmtOp(op.pctNoPrazo, "%")} />
            <Metrica rotulo="Ciclo médio (dias)" valor={fmtOp(op.cicloMedio)} />
            <Metrica rotulo="Publicado no dia" valor={fmtOp(op.pctPublicadoNoDia, "%")} />
            <Metrica rotulo="Remarcadas" valor={fmtOp(op.pctRemarcadas, "%")} />
            <Metrica rotulo="Aprovado de 1ª" valor={fmtOp(op.pctPrimeiraRodada, "%")} />
            <Metrica rotulo="Rodadas por peça" valor={fmtOp(op.rodadasMedia)} />
            <Metrica rotulo="Tempo de aprovação (d)" valor={fmtOp(op.tempoAprovacao)} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-x-6">
            <Metrica rotulo="Posts" valor={resultados.producao.posts} />
            <Metrica rotulo="Vídeos" valor={resultados.producao.videos} />
            <Metrica rotulo="Materiais gráficos" valor={resultados.producao.materiais} />
            <Metrica rotulo="Minutos gravados" valor={resultados.producao.minutos} />
          </div>
        </Bloco>

        {/* Campanhas */}
        {resultados.campanhas.length > 0 && (
          <Bloco titulo="Campanhas (janela de 90 dias)">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-neutral-300 text-left text-[11px] uppercase tracking-wide text-neutral-500">
                  <th className="py-1.5 pr-2 font-medium">Campanha</th>
                  <th className="py-1.5 pr-2 font-medium">Status</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Investido</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Leads</th>
                  <th className="py-1.5 pr-2 text-right font-medium">CPL</th>
                  <th className="py-1.5 text-right font-medium">CTR</th>
                </tr>
              </thead>
              <tbody>
                {resultados.campanhas.map((cp) => (
                  <tr key={cp.id} className="border-b border-neutral-100">
                    <td className="py-1.5 pr-2">{cp.nome} <span className="text-neutral-400">· {cp.plataforma}</span></td>
                    <td className="py-1.5 pr-2">{cp.status}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{cp.investido > 0 ? formatBRL(cp.investido) : "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{cp.leads || "—"}</td>
                    <td className="py-1.5 pr-2 text-right tabular-nums">{cp.cpl != null ? formatBRL(cp.cpl) : "—"}</td>
                    <td className="py-1.5 text-right tabular-nums">{cp.ctr != null ? `${cp.ctr}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Bloco>
        )}

        {/* Contrato & financeiro (gate) */}
        {podeFinanceiro && (
          <Bloco titulo="Contrato & financeiro">
            <div className="grid grid-cols-3 gap-x-6">
              <Metrica rotulo={`Contrato mensal (${resumo.contratosAtivos})`} valor={resumo.mrr > 0 ? formatBRL(resumo.mrr) : "—"} />
              {fin && <Metrica rotulo={`A receber (${fin.aReceber.qtd})`} valor={fin.aReceber.total > 0 ? formatBRL(fin.aReceber.total) : "—"} />}
              {fin && <Metrica rotulo={`Vencido (${fin.vencido.qtd})`} valor={<span style={fin.vencido.total > 0 ? { color: "#dc2626" } : undefined}>{fin.vencido.total > 0 ? formatBRL(fin.vencido.total) : "—"}</span>} />}
            </div>
            {estacao.contratosLista.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {estacao.contratosLista.map((ct) => (
                  <li key={ct.id} className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-1">
                    <span>
                      {ct.descricao || "Contrato"} <span className="text-neutral-500">· {formatDate(ct.dataInicio)}{ct.dataFim ? ` → ${formatDate(ct.dataFim)}` : " → vigente"}{ct.reajusteEm ? ` · reajuste ${formatDate(ct.reajusteEm)}` : ""}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">{formatBRL(Number(ct.valorMensal))} <span className="font-normal text-neutral-500">({ct.status})</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Bloco>
        )}

        {/* Planejamento vigente */}
        {planejamento.vigente && (
          <Bloco titulo={`Planejamento vigente — ${String(planejamento.mes).padStart(2, "0")}/${planejamento.ano}`}>
            <div className="space-y-2 text-sm">
              {planejamento.vigente.objetivoPrincipal && <p><strong>Objetivo:</strong> {planejamento.vigente.objetivoPrincipal}</p>}
              {planejamento.vigente.pilares && <p><strong>Pilares:</strong> {planejamento.vigente.pilares}</p>}
              {planejamento.vigente.produtosPrioritarios && <p><strong>Produtos prioritários:</strong> {planejamento.vigente.produtosPrioritarios}</p>}
              {planejamento.vigente.datasImportantes && <p><strong>Datas importantes:</strong> {planejamento.vigente.datasImportantes}</p>}
              {podeFinanceiro && planejamento.vigente.verbaMidia != null && <p><strong>Verba de mídia:</strong> {formatBRL(Number(planejamento.vigente.verbaMidia))}</p>}
            </div>
          </Bloco>
        )}

        {/* Regra de ouro do dossiê */}
        {dossie.antesDeProduzir && (
          <Bloco titulo="Antes de produzir (dossiê)">
            <p className="rounded border-2 border-[#f7ff19] bg-[#fdffd6] p-3 text-sm">{dossie.antesDeProduzir}</p>
          </Bloco>
        )}

        {/* Últimos acontecimentos */}
        {relacionamento.length > 0 && (
          <Bloco titulo="Últimos acontecimentos">
            <ul className="space-y-1 text-sm">
              {relacionamento.slice(0, 14).map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="w-20 shrink-0 tabular-nums text-neutral-500">{formatDate(e.data)}</span>
                  <span className="min-w-0">{e.descricao}</span>
                </li>
              ))}
            </ul>
          </Bloco>
        )}

        <footer className="mt-8 border-t border-neutral-200 pt-3 text-center text-[11px] text-neutral-400">
          Relatório da conta · gerado em {dataBR(new Date())} · uso interno · Plante Comunicação
        </footer>
      </article>
    </div>
  );
}
