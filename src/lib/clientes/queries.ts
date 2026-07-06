import "server-only";
import { db } from "@/lib/db";

/** Visão 360 de um cliente: dados, brand kit, trabalho em andamento e resumo. */
export async function obterClienteVisao(id: string) {
  const c = await db.cliente.findUnique({
    where: { id },
    select: {
      id: true, nome: true, nomeFantasia: true, status: true, arquivado: true,
      documento: true, inscricaoEstadual: true, inscricaoMunicipal: true,
      email: true, telefone: true, contatoNome: true, endereco: true, cep: true,
      condicoesComerciais: true, escopo: true, tomDeVoz: true, redesSociais: true,
      linksUteis: true, logoUrl: true, portalToken: true,
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
