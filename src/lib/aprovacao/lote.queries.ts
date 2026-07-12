import "server-only";
import { db } from "@/lib/db";

/** Jobs de um cliente que podem entrar numa rodada de aprovação (não concluídos, não arquivados). */
export async function listarJobsAprovaveis(clienteId: string) {
  return db.job.findMany({
    where: {
      clienteId,
      arquivado: false,
      aprovacaoStatus: { in: ["rascunho", "enviado", "ajustes"] },
    },
    orderBy: [{ prazoPostagem: "asc" }, { criadoEm: "desc" }],
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      formatos: true,
      prazoPostagem: true,
      aprovacaoStatus: true,
    },
  });
}

/** Dados públicos de uma rodada de aprovação (sem login). */
export async function obterLoteParaAprovacao(token: string) {
  const lote = await db.aprovacaoLote.findUnique({
    where: { token },
    select: {
      id: true,
      titulo: true,
      status: true,
      criadoEm: true,
      cliente: { select: { nome: true, nomeFantasia: true, logoUrl: true } },
      itens: {
        orderBy: { ordem: "asc" },
        select: {
          jobId: true,
          ordem: true,
          decisao: true,
          comentario: true,
          respondidoEm: true,
          job: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              legenda: true,
              formatos: true,
              prazoPostagem: true,
            },
          },
        },
      },
    },
  });
  if (!lote) return null;

  const jobIds = lote.itens.map((i) => i.jobId);
  const anexos = await db.anexo.findMany({
    where: { entidadeTipo: "job", entidadeId: { in: jobIds }, atual: true },
    orderBy: [{ versao: "desc" }, { criadoEm: "asc" }],
    select: { id: true, nome: true, tipo: true, url: true, contentType: true, entidadeId: true },
  });

  const anexosPorJob = new Map<string, typeof anexos>();
  for (const a of anexos) {
    const lista = anexosPorJob.get(a.entidadeId) ?? [];
    lista.push(a);
    anexosPorJob.set(a.entidadeId, lista);
  }

  return { lote, anexosPorJob };
}

/** Detalhe interno de uma rodada (para acompanhar respostas). */
export async function obterLoteInterno(id: string) {
  return db.aprovacaoLote.findUnique({
    where: { id },
    select: {
      id: true,
      token: true,
      titulo: true,
      status: true,
      criadoEm: true,
      encerradoEm: true,
      cliente: { select: { id: true, nome: true, nomeFantasia: true, email: true } },
      criadoPor: { select: { nome: true } },
      itens: {
        orderBy: { ordem: "asc" },
        select: {
          jobId: true,
          decisao: true,
          comentario: true,
          autorNome: true,
          respondidoEm: true,
          job: { select: { id: true, numero: true, titulo: true, aprovacaoStatus: true } },
        },
      },
    },
  });
}

/** Rodadas de aprovação de um cliente (para o painel interno). */
export async function listarLotesDoCliente(clienteId: string) {
  return db.aprovacaoLote.findMany({
    where: { clienteId },
    orderBy: { criadoEm: "desc" },
    select: {
      id: true,
      token: true,
      titulo: true,
      status: true,
      criadoEm: true,
      _count: { select: { itens: true } },
    },
  });
}
