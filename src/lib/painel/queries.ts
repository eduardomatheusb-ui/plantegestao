import "server-only";
import { db } from "@/lib/db";
import type { Janela, Periodo } from "./periodo";

const DIA = 24 * 60 * 60 * 1000;
const round1 = (n: number) => Math.round(n * 10) / 10;
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export type Formato = "moeda" | "pct" | "dias" | "num" | "cpl";

export type Indicador = {
  chave: string;
  label: string;
  valor: number | null;
  formato: Formato;
  anterior: number | null; // null = sem comparação (indicador de estado atual)
  melhorQuando: "maior" | "menor";
  ajuda?: string;
};

export type Distribuicao = { label: string; valor: number };

export type Bloco = {
  chave: string;
  titulo: string;
  descricao: string;
  indicadores: Indicador[];
  donuts?: { label: string; pct: number }[];
  barras?: Distribuicao[];
};

// ── Métricas comparáveis (calculadas para uma janela de tempo) ──────────────

type Snap = {
  pctNoPrazo: number | null;
  cicloMedio: number | null;
  pctPublicadoNoDia: number | null;
  pctRemarcadas: number | null;
  pctPrimeiraRodada: number | null;
  rodadasMedia: number | null;
  tempoAprovacao: number | null;
  coberturaAprovacao: number | null;
  cpl: number | null;
  ctr: number | null;
  pctMetas: number | null;
  churn: number | null;
  tempoContrato: number | null;
  margemMedia: number | null;
};

async function metricas({ inicio: ini, fim }: Janela): Promise<Snap> {
  const [
    concluidosPrazo, cicloRows, publicadas, planejadas,
    aprovadosEventos, postTotal, postComFluxo,
    resAgg, resPorCampanha, comMeta,
    contratosEncerrados, baseInicio, recRaw, despRaw,
  ] = await Promise.all([
    db.job.findMany({ where: { concluidoEm: { gte: ini, lt: fim }, prazo: { not: null } }, select: { concluidoEm: true, prazo: true } }),
    db.job.findMany({ where: { concluidoEm: { gte: ini, lt: fim } }, select: { criadoEm: true, concluidoEm: true } }),
    db.job.findMany({ where: { publicadoEm: { gte: ini, lt: fim } }, select: { publicadoEm: true, prazoPostagem: true } }),
    db.job.findMany({ where: { prazoPostagem: { gte: ini, lt: fim } }, select: { remarcacoesPostagem: true } }),
    db.aprovacaoEvento.findMany({ where: { acao: "aprovado", criadoEm: { gte: ini, lt: fim } }, select: { jobId: true } }),
    db.job.count({ where: { arquivado: false, prazoPostagem: { gte: ini, lt: fim } } }),
    db.job.count({ where: { arquivado: false, prazoPostagem: { gte: ini, lt: fim }, aprovacaoStatus: { not: "rascunho" } } }),
    db.campanhaResultado.aggregate({ _sum: { investido: true, cliques: true, alcance: true, leads: true }, where: { data: { gte: ini, lt: fim } } }),
    db.campanhaResultado.groupBy({ by: ["campanhaId"], where: { data: { gte: ini, lt: fim } }, _sum: { leads: true, investido: true } }),
    db.campanha.findMany({ where: { OR: [{ metaLeads: { not: null } }, { metaCpl: { not: null } }] }, select: { id: true, metaLeads: true, metaCpl: true } }),
    db.contrato.findMany({ where: { dataFim: { gte: ini, lt: fim } }, select: { dataInicio: true, dataFim: true } }),
    db.contrato.count({ where: { dataInicio: { lt: ini }, OR: [{ dataFim: null }, { dataFim: { gte: ini } }] } }),
    db.lancamento.groupBy({ by: ["clienteId"], where: { tipo: "RECEITA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim }, clienteId: { not: null } }, _sum: { valor: true } }),
    db.lancamento.groupBy({ by: ["clienteId"], where: { tipo: "DESPESA", status: "QUITADO", dataPagamento: { gte: ini, lt: fim }, clienteId: { not: null } }, _sum: { valor: true } }),
  ]);

  // Bloco 1 — prazo e fluxo
  const noPrazo = concluidosPrazo.filter((j) => j.concluidoEm! <= j.prazo!).length;
  const pctNoPrazo = concluidosPrazo.length ? Math.round((noPrazo / concluidosPrazo.length) * 100) : null;
  const cicloMedio = cicloRows.length
    ? round1(cicloRows.reduce((s, j) => s + (j.concluidoEm!.getTime() - j.criadoEm.getTime()) / DIA, 0) / cicloRows.length)
    : null;
  const pubNoDia = publicadas.filter((p) => p.prazoPostagem && p.publicadoEm && sameDay(p.publicadoEm, p.prazoPostagem)).length;
  const pctPublicadoNoDia = publicadas.length ? Math.round((pubNoDia / publicadas.length) * 100) : null;
  const remarc = planejadas.filter((p) => p.remarcacoesPostagem > 0).length;
  const pctRemarcadas = planejadas.length ? Math.round((remarc / planejadas.length) * 100) : null;

  // Bloco 2 — retrabalho (histórico de aprovação das peças aprovadas na janela)
  let pctPrimeiraRodada: number | null = null, rodadasMedia: number | null = null, tempoAprovacao: number | null = null;
  const jobIds = [...new Set(aprovadosEventos.map((e) => e.jobId))];
  if (jobIds.length) {
    const eventos = await db.aprovacaoEvento.findMany({ where: { jobId: { in: jobIds } }, select: { jobId: true, acao: true, criadoEm: true }, orderBy: { criadoEm: "asc" } });
    const porJob = new Map<string, { acao: string; criadoEm: Date }[]>();
    for (const e of eventos) {
      const arr = porJob.get(e.jobId) ?? [];
      arr.push({ acao: e.acao, criadoEm: e.criadoEm });
      porJob.set(e.jobId, arr);
    }
    let semAjuste = 0, somaRodadas = 0, somaTempo = 0, nTempo = 0;
    for (const jid of jobIds) {
      const evs = porJob.get(jid) ?? [];
      const ajustes = evs.filter((e) => e.acao === "ajustes").length;
      const envios = evs.filter((e) => e.acao === "enviado" || e.acao === "reenviado").length;
      if (ajustes === 0) semAjuste++;
      somaRodadas += Math.max(1, envios || ajustes + 1);
      const primeiroEnvio = evs.find((e) => e.acao === "enviado")?.criadoEm;
      const aprovado = [...evs].reverse().find((e) => e.acao === "aprovado")?.criadoEm;
      if (primeiroEnvio && aprovado) { somaTempo += (aprovado.getTime() - primeiroEnvio.getTime()) / DIA; nTempo++; }
    }
    pctPrimeiraRodada = Math.round((semAjuste / jobIds.length) * 100);
    rodadasMedia = round1(somaRodadas / jobIds.length);
    tempoAprovacao = nTempo ? round1(somaTempo / nTempo) : null;
  }
  const coberturaAprovacao = postTotal ? Math.round((postComFluxo / postTotal) * 100) : null;

  // Bloco 3 — resultado de tráfego
  const invest = Number(resAgg._sum.investido ?? 0);
  const leadsT = resAgg._sum.leads ?? 0;
  const cliques = resAgg._sum.cliques ?? 0;
  const alcance = resAgg._sum.alcance ?? 0;
  const cpl = leadsT > 0 ? round1(invest / leadsT) : null;
  const ctr = alcance > 0 ? round1((cliques / alcance) * 100) : null;

  const resMap = new Map(resPorCampanha.map((r) => [r.campanhaId, { leads: r._sum.leads ?? 0, investido: Number(r._sum.investido ?? 0) }]));
  let avaliadas = 0, atingidas = 0;
  for (const c of comMeta) {
    const r = resMap.get(c.id);
    if (!r) continue; // sem resultado na janela → não avalia
    avaliadas++;
    let ok = true;
    if (c.metaLeads != null) ok = ok && r.leads >= c.metaLeads;
    if (c.metaCpl != null) { const q = r.leads > 0 ? r.investido / r.leads : Infinity; ok = ok && q <= Number(c.metaCpl); }
    if (ok) atingidas++;
  }
  const pctMetas = avaliadas ? Math.round((atingidas / avaliadas) * 100) : null;

  // Bloco 4 — retenção
  const encerrados = contratosEncerrados.length;
  const churn = baseInicio > 0 ? round1((encerrados / baseInicio) * 100) : null;
  const durs = contratosEncerrados.filter((c) => c.dataInicio && c.dataFim).map((c) => (c.dataFim!.getTime() - c.dataInicio!.getTime()) / DIA);
  const tempoContrato = durs.length ? Math.round(durs.reduce((s, d) => s + d, 0) / durs.length) : null;

  // Bloco 6 — margem média por cliente (contribuição no período)
  const recDe = new Map<string, number>();
  recRaw.forEach((r) => { if (r.clienteId) recDe.set(r.clienteId, Number(r._sum.valor ?? 0)); });
  const despDe = new Map<string, number>();
  despRaw.forEach((d) => { if (d.clienteId) despDe.set(d.clienteId, Number(d._sum.valor ?? 0)); });
  const idsRec = [...recDe.keys()];
  const margemMedia = idsRec.length
    ? Math.round(idsRec.reduce((s, id) => s + (recDe.get(id)! - (despDe.get(id) ?? 0)), 0) / idsRec.length)
    : null;

  return {
    pctNoPrazo, cicloMedio, pctPublicadoNoDia, pctRemarcadas,
    pctPrimeiraRodada, rodadasMedia, tempoAprovacao, coberturaAprovacao,
    cpl, ctr, pctMetas, churn, tempoContrato, margemMedia,
  };
}

// ── Estado atual (ponto no tempo, sem comparação) ───────────────────────────

async function estadoAtual() {
  const agora = new Date();
  const lim7 = new Date(agora.getTime() - 7 * DIA);
  const lim30 = new Date(agora.getTime() - 30 * DIA);

  const [parados7, cargaRaw, usuarios, clientesAtivos, clientesComJob, contratosAtivos, vencidos, clientesCad] = await Promise.all([
    db.job.count({ where: { arquivado: false, status: { isConcluido: false }, atualizadoEm: { lt: lim7 } } }),
    db.job.groupBy({ by: ["responsavelId"], where: { arquivado: false, status: { isConcluido: false } }, _count: { _all: true } }),
    db.usuario.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    db.cliente.count({ where: { arquivado: false } }),
    db.job.findMany({ where: { arquivado: false, atualizadoEm: { gte: lim30 } }, select: { clienteId: true }, distinct: ["clienteId"] }),
    db.contrato.findMany({ where: { status: "ativo" }, select: { valorMensal: true } }),
    db.lancamento.findMany({ where: { tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { lt: agora }, clienteId: { not: null } }, select: { valor: true, acrescimos: true, descontos: true } }),
    db.cliente.findMany({ where: { arquivado: false }, select: { contatoNome: true, tomDeVoz: true } }),
  ]);

  const nomePorId = new Map(usuarios.map((u) => [u.id, u.nome]));
  const carga = cargaRaw
    .map((c) => ({ label: c.responsavelId ? nomePorId.get(c.responsavelId) ?? "—" : "Sem responsável", valor: c._count._all }))
    .sort((a, b) => b.valor - a.valor);

  const clientesParados = Math.max(0, clientesAtivos - clientesComJob.length);

  const mrr = contratosAtivos.reduce((s, c) => s + Number(c.valorMensal), 0);
  const inadTotal = vencidos.reduce((s, v) => s + Number(v.valor) + Number(v.acrescimos) - Number(v.descontos), 0);

  const completos = clientesCad.filter((c) => !!c.contatoNome && !!c.tomDeVoz).length;
  const completudePct = clientesCad.length ? Math.round((completos / clientesCad.length) * 100) : null;

  return {
    parados7,
    carga,
    clientesAtivos,
    clientesParados,
    mrr,
    arr: mrr * 12,
    inadimplencia: inadTotal,
    aReceberVencidoQtd: vencidos.length,
    completudePct,
  };
}

/** Distribuição dos motivos de perda dos leads perdidos na janela. */
async function motivosPerda({ inicio: ini, fim }: Janela): Promise<Distribuicao[]> {
  const perdidos = await db.lead.findMany({
    where: { etapa: "perdido", atualizadoEm: { gte: ini, lt: fim } },
    select: { motivoPerda: true },
  });
  const mapa = new Map<string, number>();
  for (const l of perdidos) {
    const m = l.motivoPerda?.trim() || "Não informado";
    mapa.set(m, (mapa.get(m) ?? 0) + 1);
  }
  return [...mapa.entries()].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor);
}

// ── Montagem do painel ──────────────────────────────────────────────────────

function ind(
  chave: string, label: string, valor: number | null, formato: Formato,
  anterior: number | null, melhorQuando: "maior" | "menor" = "maior", ajuda?: string,
): Indicador {
  return { chave, label, valor, formato, anterior, melhorQuando, ajuda };
}

export async function carregarPainel(periodo: Periodo): Promise<{ blocos: Bloco[]; geradoEm: Date }> {
  const [snap, ant, estado, motivos] = await Promise.all([
    metricas({ inicio: periodo.inicio, fim: periodo.fim }),
    metricas(periodo.anterior),
    estadoAtual(),
    motivosPerda({ inicio: periodo.inicio, fim: periodo.fim }),
  ]);

  const blocos: Bloco[] = [
    {
      chave: "prazo",
      titulo: "Prazo e fluxo de entrega",
      descricao: "Velocidade e pontualidade das entregas.",
      indicadores: [
        ind("pct_no_prazo", "Jobs concluídos no prazo", snap.pctNoPrazo, "pct", ant.pctNoPrazo, "maior", "Concluídos com data ≤ prazo, entre os que têm prazo."),
        ind("ciclo_medio", "Tempo médio de ciclo", snap.cicloMedio, "dias", ant.cicloMedio, "menor", "Da criação à conclusão do job."),
        ind("parados_7", "Jobs parados +7 dias", estado.parados7, "num", null, "menor", "Sem movimento há mais de 7 dias (estado atual)."),
        ind("pub_no_dia", "Postagens no dia planejado", snap.pctPublicadoNoDia, "pct", ant.pctPublicadoNoDia, "maior", "Publicadas na data que estava no calendário."),
        ind("remarcadas", "Postagens remarcadas", snap.pctRemarcadas, "pct", ant.pctRemarcadas, "menor", "Tiveram a data de postagem alterada."),
      ],
      donuts: [
        ...(snap.pctNoPrazo != null ? [{ label: "No prazo", pct: snap.pctNoPrazo }] : []),
        ...(snap.pctPublicadoNoDia != null ? [{ label: "No dia planejado", pct: snap.pctPublicadoNoDia }] : []),
      ],
    },
    {
      chave: "retrabalho",
      titulo: "Retrabalho e taxa de acerto",
      descricao: "Quanto as peças voltam para ajuste antes de aprovar.",
      indicadores: [
        ind("primeira_rodada", "Aprovadas na 1ª rodada", snap.pctPrimeiraRodada, "pct", ant.pctPrimeiraRodada, "maior", "Aprovadas sem nenhum pedido de ajuste."),
        ind("rodadas_media", "Rodadas por peça", snap.rodadasMedia, "num", ant.rodadasMedia, "menor", "Número médio de envios até aprovar."),
        ind("tempo_aprovacao", "Tempo até aprovação", snap.tempoAprovacao, "dias", ant.tempoAprovacao, "menor", "Do primeiro envio à aprovação."),
      ],
      donuts: snap.pctPrimeiraRodada != null ? [{ label: "1ª rodada", pct: snap.pctPrimeiraRodada }] : [],
    },
    {
      chave: "resultado",
      titulo: "Resultado entregue ao cliente",
      descricao: "Desempenho das campanhas de tráfego.",
      indicadores: [
        ind("cpl", "CPL médio", snap.cpl, "cpl", ant.cpl, "menor", "Custo por lead (investido ÷ leads)."),
        ind("ctr", "CTR médio", snap.ctr, "pct", ant.ctr, "maior", "Cliques ÷ alcance."),
        ind("metas", "Metas de campanha atingidas", snap.pctMetas, "pct", ant.pctMetas, "maior", "Entre campanhas com meta definida e resultado no período."),
      ],
    },
    {
      chave: "retencao",
      titulo: "Retenção e satisfação",
      descricao: "Permanência dos clientes e motivos de saída.",
      indicadores: [
        ind("tempo_contrato", "Tempo médio de contrato", snap.tempoContrato, "dias", ant.tempoContrato, "maior", "Duração dos contratos encerrados no período."),
        ind("churn", "Churn", snap.churn, "pct", ant.churn, "menor", "Contratos encerrados ÷ ativos no início do período."),
        ind("clientes_parados", "Clientes parados +30 dias", estado.clientesParados, "num", null, "menor", "Ativos sem nenhum job nos últimos 30 dias (estado atual)."),
      ],
      barras: motivos,
    },
    {
      chave: "processo",
      titulo: "Processo e equipe",
      descricao: "Carga da equipe, cadastro e uso do fluxo de aprovação.",
      indicadores: [
        ind("completude", "Cadastro de clientes completo", estado.completudePct, "pct", null, "maior", "Ativos com contato e brand kit preenchidos (estado atual)."),
        ind("cobertura_aprovacao", "Aprovação via link", snap.coberturaAprovacao, "pct", ant.coberturaAprovacao, "maior", "Peças do período que passaram pelo fluxo de aprovação por link."),
      ],
      barras: estado.carga.map((c) => ({ label: c.label, valor: c.valor })),
    },
    {
      chave: "financeiro",
      titulo: "Saúde financeira",
      descricao: "Receita recorrente, margem e inadimplência.",
      indicadores: [
        ind("mrr", "MRR", estado.mrr, "moeda", null, "maior", "Receita recorrente mensal (contratos ativos, estado atual)."),
        ind("arr", "ARR", estado.arr, "moeda", null, "maior", "Receita recorrente anual (MRR × 12)."),
        ind("margem_media", "Margem média por cliente", snap.margemMedia, "moeda", ant.margemMedia, "maior", "Receita − despesa atribuída, quitados no período."),
        ind("inadimplencia", "A receber vencido", estado.inadimplencia, "moeda", null, "menor", "Receitas em aberto vencidas (estado atual)."),
      ],
    },
  ];

  return { blocos, geradoEm: new Date() };
}

export type PainelDados = Awaited<ReturnType<typeof carregarPainel>>;
