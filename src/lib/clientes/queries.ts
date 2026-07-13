import "server-only";
import { db } from "@/lib/db";
import { BUCKET_TIPOS } from "@/lib/clientes/escopo";

/** Clientes ativos com dados faltando (contato ou brand kit). */
export async function clientesIncompletos() {
  const cs = await db.cliente.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
    select: {
      id: true, nome: true, nomeFantasia: true, status: true,
      telefone: true, email: true, contatoNome: true,
      escopo: true, tomDeVoz: true, redesSociais: true, documento: true,
    },
  });
  const vazio = (v: string | null) => !v || !v.trim();
  return cs
    .map((c) => {
      const faltando: string[] = [];
      if (vazio(c.telefone) && vazio(c.email)) faltando.push("contato (tel/e-mail)");
      else {
        if (vazio(c.telefone)) faltando.push("telefone");
        if (vazio(c.email)) faltando.push("e-mail");
      }
      if (vazio(c.contatoNome)) faltando.push("nome do contato");
      if (vazio(c.documento)) faltando.push("CNPJ/CPF");
      if (vazio(c.escopo) && vazio(c.tomDeVoz) && vazio(c.redesSociais)) faltando.push("brand kit");
      return { id: c.id, nome: c.nomeFantasia || c.nome, status: c.status, faltando };
    })
    .filter((c) => c.faltando.length > 0);
}

/** Relatório mensal do cliente (postagens, jobs entregues, tráfego) para PDF. */
export async function relatorioCliente(id: string, ano: number, mes: number) {
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);

  const cliente = await db.cliente.findUnique({
    where: { id },
    select: { id: true, nome: true, nomeFantasia: true, logoUrl: true },
  });
  if (!cliente) return null;

  const [postagens, entregues, campanhas] = await Promise.all([
    db.job.findMany({
      where: { clienteId: id, prazoPostagem: { gte: inicio, lt: fim } },
      orderBy: { prazoPostagem: "asc" },
      select: { id: true, titulo: true, prazoPostagem: true, formatos: true, aprovacaoStatus: true },
    }),
    db.job.findMany({
      where: { clienteId: id, concluidoEm: { gte: inicio, lt: fim } },
      orderBy: { concluidoEm: "asc" },
      select: { id: true, numero: true, titulo: true, tipo: true, concluidoEm: true },
    }),
    db.campanha.findMany({
      where: { clienteId: id, resultados: { some: { data: { gte: inicio, lt: fim } } } },
      select: {
        id: true, nome: true, plataforma: true,
        resultados: { where: { data: { gte: inicio, lt: fim } }, select: { investido: true, alcance: true, cliques: true, conversoes: true, leads: true } },
      },
    }),
  ]);

  const trafego = campanhas.map((c) => {
    const t = c.resultados.reduce(
      (a, r) => ({
        investido: a.investido + Number(r.investido),
        alcance: a.alcance + r.alcance,
        cliques: a.cliques + r.cliques,
        conversoes: a.conversoes + r.conversoes,
        leads: a.leads + r.leads,
      }),
      { investido: 0, alcance: 0, cliques: 0, conversoes: 0, leads: 0 },
    );
    return { id: c.id, nome: c.nome, plataforma: c.plataforma, ...t, cpl: t.leads > 0 ? t.investido / t.leads : null };
  });

  return { cliente, postagens, entregues, trafego, ano, mes };
}

/** Visão 360 de um cliente: dados, brand kit, trabalho em andamento e resumo. */
export async function obterClienteVisao(id: string) {
  const c = await db.cliente.findUnique({
    where: { id },
    select: {
      id: true, nome: true, nomeFantasia: true, status: true, arquivado: true,
      documento: true, inscricaoEstadual: true, inscricaoMunicipal: true,
      email: true, telefone: true, contatoNome: true, endereco: true, cep: true,
      condicoesComerciais: true, escopo: true, tomDeVoz: true, redesSociais: true,
      linksUteis: true, logoUrl: true, portalToken: true, portalSlug: true,
      lookerEmbedUrl: true, criadoEm: true,
      atendimento: { select: { id: true, nome: true } },
      estrategia: { select: { id: true, nome: true } },
      dossie: true,
    },
  });
  if (!c) return null;

  const agora = new Date();
  const [jobsAtivos, projetosAtivos, postagens, aguardandoAprovacao, contratos] = await Promise.all([
    db.job.findMany({
      where: { clienteId: id, arquivado: false, status: { isConcluido: false } },
      orderBy: [{ prazo: { sort: "asc", nulls: "last" } }, { numero: "desc" }],
      take: 30,
      select: { id: true, numero: true, titulo: true, tipo: true, prazo: true, status: { select: { nome: true, cor: true } } },
    }),
    db.projeto.findMany({
      where: { clienteId: id, arquivado: false },
      orderBy: { numero: "desc" }, take: 15,
      select: { id: true, numero: true, nome: true },
    }),
    db.job.findMany({
      where: { clienteId: id, arquivado: false, prazoPostagem: { gte: agora } },
      orderBy: { prazoPostagem: "asc" }, take: 15,
      select: { id: true, titulo: true, prazoPostagem: true, aprovacaoStatus: true, formatos: true },
    }),
    db.job.count({ where: { clienteId: id, arquivado: false, aprovacaoStatus: "enviado" } }),
    db.contrato.findMany({ where: { clienteId: id, status: "ativo" }, select: { valorMensal: true } }),
  ]);

  const mrr = contratos.reduce((s, ct) => s + Number(ct.valorMensal), 0);

  return {
    cliente: c,
    jobsAtivos,
    projetosAtivos,
    postagens,
    resumo: {
      jobsAtivos: jobsAtivos.length,
      postagens: postagens.length,
      aguardandoAprovacao,
      mrr,
      contratosAtivos: contratos.length,
    },
  };
}

/** Estação do Cliente — cockpit da Visão Geral + metadados do cabeçalho. */
export async function estacaoResumo(clienteId: string) {
  const agora = new Date();
  const fimSemana = new Date(agora.getTime() + 7 * 24 * 3600 * 1000);

  const [
    abertas, atrasadas, aguardandoCliente, ajustes, entregasSemana, programados,
    campanhasAtivas, proximaEntrega, proximoCompromisso, ultimaReuniao,
    ultimoEventoAprovacao, primeiroContrato, equipeJobs,
  ] = await Promise.all([
    db.job.count({ where: { clienteId, arquivado: false, status: { isConcluido: false } } }),
    db.job.count({ where: { clienteId, arquivado: false, status: { isConcluido: false }, prazo: { lt: agora } } }),
    db.job.count({ where: { clienteId, arquivado: false, aprovacaoStatus: "enviado" } }),
    db.job.count({ where: { clienteId, arquivado: false, aprovacaoStatus: "ajustes" } }),
    db.job.count({ where: { clienteId, arquivado: false, status: { isConcluido: false }, prazo: { gte: agora, lt: fimSemana } } }),
    db.job.count({ where: { clienteId, arquivado: false, prazoPostagem: { gte: agora } } }),
    db.campanha.count({ where: { clienteId, status: "ativa" } }),
    db.job.findFirst({
      where: { clienteId, arquivado: false, status: { isConcluido: false }, prazo: { gte: agora } },
      orderBy: { prazo: "asc" },
      select: { id: true, titulo: true, prazo: true },
    }),
    db.compromisso.findFirst({
      where: { clienteId, inicio: { gte: agora } },
      orderBy: { inicio: "asc" },
      select: { id: true, titulo: true, tipo: true, inicio: true },
    }),
    db.reuniao.findFirst({
      where: { clienteId },
      orderBy: { data: "desc" },
      select: { id: true, titulo: true, data: true },
    }),
    db.aprovacaoEvento.findFirst({
      where: { job: { clienteId } },
      orderBy: { criadoEm: "desc" },
      select: { acao: true, autor: true, criadoEm: true, job: { select: { titulo: true } } },
    }),
    db.contrato.findFirst({ where: { clienteId }, orderBy: { dataInicio: "asc" }, select: { dataInicio: true } }),
    // Equipe envolvida = responsáveis + envolvidos dos jobs ativos (derivada, não armazenada).
    db.job.findMany({
      where: { clienteId, arquivado: false, status: { isConcluido: false } },
      select: {
        responsavel: { select: { id: true, nome: true } },
        envolvidos: { select: { usuario: { select: { id: true, nome: true } } } },
      },
    }),
  ]);

  // Listas curtas para as abas.
  const [aguardandoLista, ajustesBase, aprovadasLista, reunioesLista, contratosLista] = await Promise.all([
    db.job.findMany({
      where: { clienteId, arquivado: false, aprovacaoStatus: "enviado" },
      orderBy: { aprovacaoEm: "desc" }, take: 8,
      select: { id: true, titulo: true, aprovacaoToken: true, aprovacaoEm: true },
    }),
    db.job.findMany({
      where: { clienteId, arquivado: false, aprovacaoStatus: "ajustes" },
      orderBy: { atualizadoEm: "desc" }, take: 8,
      select: { id: true, numero: true, titulo: true },
    }),
    db.job.findMany({
      where: { clienteId, arquivado: false, aprovacaoStatus: "aprovado" },
      orderBy: { atualizadoEm: "desc" }, take: 6,
      select: { id: true, numero: true, titulo: true },
    }),
    db.reuniao.findMany({
      where: { clienteId },
      orderBy: { data: "desc" }, take: 6,
      select: { id: true, titulo: true, data: true },
    }),
    db.contrato.findMany({
      where: { clienteId },
      orderBy: [{ status: "asc" }, { dataInicio: "desc" }],
      select: { id: true, descricao: true, valorMensal: true, diaVencimento: true, dataInicio: true, dataFim: true, reajusteEm: true, reajusteObs: true, status: true },
    }),
  ]);

  // Último pedido de ajuste de cada peça em "ajustes" (autor, data e comentário do cliente).
  const eventosAjuste = ajustesBase.length
    ? await db.aprovacaoEvento.findMany({
        where: { jobId: { in: ajustesBase.map((j) => j.id) }, acao: "ajustes" },
        orderBy: { criadoEm: "desc" },
        select: { jobId: true, autor: true, comentario: true, criadoEm: true },
      })
    : [];
  const ultimoAjuste = new Map<string, { autor: string | null; comentario: string | null; criadoEm: Date }>();
  for (const e of eventosAjuste) if (!ultimoAjuste.has(e.jobId)) ultimoAjuste.set(e.jobId, e);
  const ajustesLista = ajustesBase.map((j) => ({ ...j, ultimoAjuste: ultimoAjuste.get(j.id) ?? null }));

  const equipeMap = new Map<string, string>();
  for (const j of equipeJobs) {
    if (j.responsavel) equipeMap.set(j.responsavel.id, j.responsavel.nome);
    for (const e of j.envolvidos) equipeMap.set(e.usuario.id, e.usuario.nome);
  }
  const equipe = [...equipeMap.entries()].map(([id, nome]) => ({ id, nome })).slice(0, 10);

  // Última interação registrada: reunião ou resposta/envio de aprovação, o que for mais recente.
  const candidatos: { data: Date; descricao: string }[] = [];
  if (ultimaReuniao) candidatos.push({ data: ultimaReuniao.data, descricao: `Reunião — ${ultimaReuniao.titulo}` });
  if (ultimoEventoAprovacao) {
    const rot = { enviado: "enviado para aprovação", reenviado: "reenviado para aprovação", aprovado: "aprovado pelo cliente", ajustes: "ajustes solicitados" }[ultimoEventoAprovacao.acao] ?? ultimoEventoAprovacao.acao;
    candidatos.push({ data: ultimoEventoAprovacao.criadoEm, descricao: `${ultimoEventoAprovacao.job.titulo} — ${rot}` });
  }
  const ultimaInteracao = candidatos.sort((a, b) => b.data.getTime() - a.data.getTime())[0] ?? null;

  return {
    cockpit: { abertas, atrasadas, aguardandoCliente, ajustes, entregasSemana, programados, campanhasAtivas },
    proximaEntrega,
    proximoCompromisso,
    ultimaInteracao,
    contaDesde: primeiroContrato?.dataInicio ?? null,
    equipe,
    aguardandoLista,
    ajustesLista,
    aprovadasLista,
    reunioesLista,
    contratosLista,
  };
}

/** Estação — consumo do escopo contratado no mês (contratado × utilizado × saldo). */
export async function consumoEscopo(clienteId: string) {
  const agora = new Date();
  const iniMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const proxMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1);

  const [itens, gruposTipo, campanhasAtivas, reunioesMes, minutosAgg] = await Promise.all([
    db.escopoItem.findMany({ where: { clienteId }, orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }] }),
    db.job.groupBy({
      by: ["tipo"],
      where: { clienteId, arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
      _count: { _all: true },
    }),
    db.campanha.count({ where: { clienteId, status: "ativa" } }),
    db.reuniao.count({ where: { clienteId, data: { gte: iniMes, lt: proxMes } } }),
    db.job.aggregate({
      _sum: { minutosGravados: true },
      where: { clienteId, arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
    }),
  ]);

  const somaTipos = (chaves: string[]) =>
    gruposTipo.filter((g) => chaves.includes(g.tipo)).reduce((s, g) => s + g._count._all, 0);

  // Utilizado no mês por bucket; "outro" não tem conta automática (null → mostra "—").
  const utilizadoPorBucket: Record<string, number | null> = {
    posts: somaTipos(BUCKET_TIPOS.posts),
    videos: somaTipos(BUCKET_TIPOS.videos),
    materiais: somaTipos(BUCKET_TIPOS.materiais),
    campanhas: campanhasAtivas,
    reunioes: reunioesMes,
    horas_captacao: Math.round(((minutosAgg._sum.minutosGravados ?? 0) / 60) * 10) / 10,
    outro: null,
  };

  return itens.map((i) => {
    const utilizado = utilizadoPorBucket[i.bucket] ?? null;
    return {
      id: i.id,
      rotulo: i.rotulo,
      bucket: i.bucket,
      unidade: i.unidade,
      contratado: i.quantidadeMensal,
      utilizado,
      saldo: utilizado == null ? null : i.quantidadeMensal - utilizado,
    };
  });
}

/** Estação — situação financeira do cliente (a receber, vencido, últimas notas). */
export async function financeiroCliente(clienteId: string) {
  const agora = new Date();
  const [aReceber, vencido, notas] = await Promise.all([
    db.lancamento.aggregate({
      _sum: { valor: true }, _count: true,
      where: { clienteId, tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { gte: agora } },
    }),
    db.lancamento.aggregate({
      _sum: { valor: true }, _count: true,
      where: { clienteId, tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { lt: agora } },
    }),
    db.notaFiscal.findMany({
      where: { clienteId },
      orderBy: { criadoEm: "desc" }, take: 5,
      select: { id: true, numero: true, status: true, valor: true, criadoEm: true, urlPdf: true },
    }),
  ]);
  return {
    aReceber: { total: Number(aReceber._sum.valor ?? 0), qtd: aReceber._count },
    vencido: { total: Number(vencido._sum.valor ?? 0), qtd: vencido._count },
    notas,
  };
}

export type EventoRelacionamento = {
  data: Date;
  tipo: "reuniao" | "aprovacao" | "demanda" | "entrega" | "publicacao" | "contrato";
  descricao: string;
  href: string | null;
};

/** Estação — linha do tempo de relacionamento: tudo que aconteceu na conta, em ordem. */
export async function timelineRelacionamento(clienteId: string): Promise<EventoRelacionamento[]> {
  const [reunioes, eventosAprov, jobs, contratos] = await Promise.all([
    db.reuniao.findMany({
      where: { clienteId },
      orderBy: { data: "desc" }, take: 30,
      select: { id: true, titulo: true, data: true },
    }),
    db.aprovacaoEvento.findMany({
      where: { job: { clienteId } },
      orderBy: { criadoEm: "desc" }, take: 40,
      select: { criadoEm: true, acao: true, autor: true, job: { select: { id: true, titulo: true } } },
    }),
    db.job.findMany({
      where: { clienteId, arquivado: false },
      orderBy: { criadoEm: "desc" }, take: 60,
      select: { id: true, titulo: true, criadoEm: true, concluidoEm: true, publicadoEm: true },
    }),
    db.contrato.findMany({
      where: { clienteId },
      select: { id: true, descricao: true, dataInicio: true, dataFim: true },
    }),
  ]);

  const eventos: EventoRelacionamento[] = [];
  const agora = new Date();

  for (const r of reunioes) eventos.push({ data: r.data, tipo: "reuniao", descricao: `Reunião — ${r.titulo}`, href: `/reunioes/${r.id}` });

  const ROTULO_ACAO: Record<string, string> = {
    enviado: "enviado para aprovação",
    reenviado: "reenviado para aprovação (nova versão)",
    aprovado: "aprovado pelo cliente",
    ajustes: "cliente solicitou ajustes",
  };
  for (const e of eventosAprov) {
    eventos.push({
      data: e.criadoEm, tipo: "aprovacao",
      descricao: `${e.job.titulo} — ${ROTULO_ACAO[e.acao] ?? e.acao}${e.autor ? ` (${e.autor})` : ""}`,
      href: `/jobs/${e.job.id}`,
    });
  }

  for (const j of jobs) {
    eventos.push({ data: j.criadoEm, tipo: "demanda", descricao: `Demanda cadastrada — ${j.titulo}`, href: `/jobs/${j.id}` });
    if (j.concluidoEm) eventos.push({ data: j.concluidoEm, tipo: "entrega", descricao: `Entrega concluída — ${j.titulo}`, href: `/jobs/${j.id}` });
    if (j.publicadoEm) eventos.push({ data: j.publicadoEm, tipo: "publicacao", descricao: `Publicado — ${j.titulo}`, href: `/jobs/${j.id}` });
  }

  for (const ct of contratos) {
    eventos.push({ data: ct.dataInicio, tipo: "contrato", descricao: `Contrato iniciado${ct.descricao ? ` — ${ct.descricao}` : ""}`, href: "/contratos" });
    if (ct.dataFim && ct.dataFim <= agora) eventos.push({ data: ct.dataFim, tipo: "contrato", descricao: `Contrato encerrado${ct.descricao ? ` — ${ct.descricao}` : ""}`, href: "/contratos" });
  }

  return eventos
    .filter((e) => e.data <= agora)
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .slice(0, 60);
}

/** Estação — indicadores operacionais e de comunicação do cliente (janela: últimos 90 dias).
 *  Mesmas fórmulas do Painel Estratégico (src/lib/painel/queries.ts), com recorte por cliente. */
export async function resultadosCliente(clienteId: string) {
  const DIA = 24 * 3600 * 1000;
  const fim = new Date();
  const ini = new Date(fim.getTime() - 90 * DIA);
  const round1 = (n: number) => Math.round(n * 10) / 10;
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const [concluidosPrazo, cicloRows, publicadas, planejadas, aprovadosEventos, gruposTipo, minutosAgg, campanhas] = await Promise.all([
    db.job.findMany({ where: { clienteId, concluidoEm: { gte: ini, lt: fim }, prazo: { not: null } }, select: { concluidoEm: true, prazo: true } }),
    db.job.findMany({ where: { clienteId, concluidoEm: { gte: ini, lt: fim } }, select: { criadoEm: true, concluidoEm: true } }),
    db.job.findMany({ where: { clienteId, publicadoEm: { gte: ini, lt: fim } }, select: { publicadoEm: true, prazoPostagem: true } }),
    db.job.findMany({ where: { clienteId, prazoPostagem: { gte: ini, lt: fim } }, select: { remarcacoesPostagem: true } }),
    db.aprovacaoEvento.findMany({ where: { acao: "aprovado", criadoEm: { gte: ini, lt: fim }, job: { clienteId } }, select: { jobId: true } }),
    db.job.groupBy({ by: ["tipo"], where: { clienteId, arquivado: false, concluidoEm: { gte: ini, lt: fim } }, _count: { _all: true } }),
    db.job.aggregate({ _sum: { minutosGravados: true }, where: { clienteId, arquivado: false, concluidoEm: { gte: ini, lt: fim } } }),
    db.campanha.findMany({
      where: { clienteId },
      orderBy: { criadoEm: "desc" }, take: 10,
      select: {
        id: true, nome: true, plataforma: true, status: true, verba: true, metaLeads: true, metaCpl: true,
        resultados: { where: { data: { gte: ini, lt: fim } }, select: { investido: true, alcance: true, cliques: true, leads: true, conversoes: true } },
      },
    }),
  ]);

  // Prazo e fluxo (fórmulas do painel).
  const noPrazo = concluidosPrazo.filter((j) => j.concluidoEm! <= j.prazo!).length;
  const pctNoPrazo = concluidosPrazo.length ? Math.round((noPrazo / concluidosPrazo.length) * 100) : null;
  const cicloMedio = cicloRows.length
    ? round1(cicloRows.reduce((s, j) => s + (j.concluidoEm!.getTime() - j.criadoEm.getTime()) / DIA, 0) / cicloRows.length)
    : null;
  const pubNoDia = publicadas.filter((p) => p.prazoPostagem && p.publicadoEm && sameDay(p.publicadoEm, p.prazoPostagem)).length;
  const pctPublicadoNoDia = publicadas.length ? Math.round((pubNoDia / publicadas.length) * 100) : null;
  const remarc = planejadas.filter((p) => p.remarcacoesPostagem > 0).length;
  const pctRemarcadas = planejadas.length ? Math.round((remarc / planejadas.length) * 100) : null;

  // Retrabalho / aprovação.
  let pctPrimeiraRodada: number | null = null, rodadasMedia: number | null = null, tempoAprovacao: number | null = null;
  const jobIds = [...new Set(aprovadosEventos.map((e) => e.jobId))];
  if (jobIds.length) {
    const eventos = await db.aprovacaoEvento.findMany({
      where: { jobId: { in: jobIds } },
      select: { jobId: true, acao: true, criadoEm: true },
      orderBy: { criadoEm: "asc" },
    });
    const porJob = new Map<string, { acao: string; criadoEm: Date }[]>();
    for (const e of eventos) {
      const arr = porJob.get(e.jobId) ?? [];
      arr.push(e);
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

  // Produção realizada (buckets da casa do cliente).
  const somaTipos = (chaves: string[]) => gruposTipo.filter((g) => chaves.includes(g.tipo)).reduce((s, g) => s + g._count._all, 0);
  const producao = {
    posts: somaTipos(BUCKET_TIPOS.posts),
    videos: somaTipos(BUCKET_TIPOS.videos),
    materiais: somaTipos(BUCKET_TIPOS.materiais),
    minutos: minutosAgg._sum.minutosGravados ?? 0,
  };

  // Campanhas com CPL/CTR (agregado da janela).
  const campanhasResumo = campanhas.map((c) => {
    const t = c.resultados.reduce(
      (a, r) => ({
        investido: a.investido + Number(r.investido),
        alcance: a.alcance + r.alcance,
        cliques: a.cliques + r.cliques,
        leads: a.leads + r.leads,
      }),
      { investido: 0, alcance: 0, cliques: 0, leads: 0 },
    );
    return {
      id: c.id, nome: c.nome, plataforma: c.plataforma, status: c.status,
      investido: t.investido, leads: t.leads,
      cpl: t.leads > 0 ? round1(t.investido / t.leads) : null,
      ctr: t.alcance > 0 ? round1((t.cliques / t.alcance) * 100) : null,
    };
  });

  return {
    janelaDias: 90,
    operacionais: { pctNoPrazo, cicloMedio, pctPublicadoNoDia, pctRemarcadas, pctPrimeiraRodada, rodadasMedia, tempoAprovacao },
    producao,
    campanhas: campanhasResumo,
  };
}

/** Estação — aba Arquivos: acessos registrados + documentos que já vivem no sistema. */
export async function arquivosCliente(clienteId: string) {
  const [acessos, propostas] = await Promise.all([
    db.clienteAcesso.findMany({
      where: { clienteId },
      orderBy: { plataforma: "asc" },
    }),
    db.proposta.findMany({
      where: { clienteId },
      orderBy: { numero: "desc" }, take: 8,
      select: { id: true, numero: true, titulo: true, status: true },
    }),
  ]);
  return { acessos, propostas };
}

/** Estação — planejamento do mês vigente + anteriores. */
export async function planejamentoCliente(clienteId: string) {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1;
  const [vigente, anteriores] = await Promise.all([
    db.planejamentoPeriodo.findUnique({ where: { clienteId_ano_mes: { clienteId, ano, mes } } }),
    db.planejamentoPeriodo.findMany({
      where: { clienteId, NOT: { ano, mes } },
      orderBy: [{ ano: "desc" }, { mes: "desc" }], take: 6,
      select: { id: true, ano: true, mes: true, objetivoPrincipal: true, status: true },
    }),
  ]);
  return { vigente, anteriores, ano, mes };
}
