import "server-only";
import { db } from "@/lib/db";

/** Dados públicos da peça para a página de aprovação do cliente (sem login). */
export async function obterParaAprovacao(token: string) {
  const job = await db.job.findUnique({
    where: { aprovacaoToken: token },
    select: {
      id: true, numero: true, titulo: true, legenda: true, formatos: true,
      prazoPostagem: true, aprovacaoStatus: true, aprovacaoEm: true,
      cliente: { select: { nome: true, nomeFantasia: true } },
    },
  });
  if (!job) return null;

  const [anexos, eventos] = await Promise.all([
    db.anexo.findMany({
      where: { entidadeTipo: "job", entidadeId: job.id },
      orderBy: { criadoEm: "asc" },
      select: { id: true, nome: true, tipo: true, url: true, contentType: true },
    }),
    db.aprovacaoEvento.findMany({
      where: { jobId: job.id },
      orderBy: { criadoEm: "desc" },
      select: { id: true, acao: true, autor: true, comentario: true, criadoEm: true },
    }),
  ]);

  return { job, anexos, eventos };
}

/** Eventos de aprovação para exibir no detalhe interno do job. */
export async function listarEventosAprovacao(jobId: string) {
  return db.aprovacaoEvento.findMany({
    where: { jobId },
    orderBy: { criadoEm: "desc" },
  });
}

/** Jobs sociais com data de postagem no mês (calendário editorial). */
export async function listarPostagensDoMes(ano: number, mes0: number) {
  const inicio = new Date(ano, mes0, 1, 0, 0, 0);
  const fim = new Date(ano, mes0 + 1, 1, 0, 0, 0);
  return db.job.findMany({
    where: { arquivado: false, prazoPostagem: { gte: inicio, lt: fim } },
    orderBy: { prazoPostagem: "asc" },
    select: {
      id: true, numero: true, titulo: true, tipo: true, prazoPostagem: true,
      formatos: true, aprovacaoStatus: true,
      cliente: { select: { nome: true, nomeFantasia: true } },
      status: { select: { nome: true, cor: true, isConcluido: true } },
    },
  });
}
