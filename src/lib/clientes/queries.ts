import "server-only";
import { db } from "@/lib/db";

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
