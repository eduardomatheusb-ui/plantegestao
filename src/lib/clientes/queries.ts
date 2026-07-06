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
