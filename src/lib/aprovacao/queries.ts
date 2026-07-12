import "server-only";
import { db } from "@/lib/db";

/** Dados públicos da peça para a página de aprovação do cliente (sem login). */
export async function obterParaAprovacao(token: string) {
  const job = await db.job.findUnique({
    where: { aprovacaoToken: token },
    select: {
      id: true, numero: true, titulo: true, legenda: true, formatos: true,
      prazoPostagem: true, aprovacaoStatus: true, aprovacaoEm: true,
      cliente: { select: { nome: true, nomeFantasia: true, logoUrl: true } },
    },
  });
  if (!job) return null;

  const [anexosTodos, eventos] = await Promise.all([
    db.anexo.findMany({
      where: { entidadeTipo: "job", entidadeId: job.id },
      orderBy: [{ versao: "desc" }, { criadoEm: "asc" }],
      select: { id: true, nome: true, tipo: true, url: true, contentType: true, versao: true, atual: true },
    }),
    db.aprovacaoEvento.findMany({
      where: { jobId: job.id },
      orderBy: { criadoEm: "desc" },
      select: { id: true, acao: true, autor: true, comentario: true, criadoEm: true },
    }),
  ]);

  const anexos = anexosTodos.filter((a) => a.atual);
  const anexosAnteriores = anexosTodos.filter((a) => !a.atual);

  return { job, anexos, anexosAnteriores, eventos };
}

/** Eventos de aprovação para exibir no detalhe interno do job. */
export async function listarEventosAprovacao(jobId: string) {
  return db.aprovacaoEvento.findMany({
    where: { jobId },
    orderBy: { criadoEm: "desc" },
  });
}

export type FiltroCalendario = {
  clienteId?: string;
  formato?: string;
  aprovacaoStatus?: string;
};

export type PostagemCalendario = Awaited<ReturnType<typeof listarPostagensDoMes>>[number];

/** Jobs sociais com data de postagem no mês (calendário editorial), com filtros e miniatura. */
export async function listarPostagensDoMes(ano: number, mes0: number, filtros: FiltroCalendario = {}) {
  const inicio = new Date(ano, mes0, 1, 0, 0, 0);
  const fim = new Date(ano, mes0 + 1, 1, 0, 0, 0);

  const posts = await db.job.findMany({
    where: {
      arquivado: false,
      prazoPostagem: { gte: inicio, lt: fim },
      ...(filtros.clienteId ? { clienteId: filtros.clienteId } : {}),
      ...(filtros.aprovacaoStatus ? { aprovacaoStatus: filtros.aprovacaoStatus } : {}),
      // formatos é CSV (ex.: "instagram_feed,stories"); filtra por substring da chave.
      ...(filtros.formato ? { formatos: { contains: filtros.formato } } : {}),
    },
    orderBy: { prazoPostagem: "asc" },
    select: {
      id: true, numero: true, titulo: true, tipo: true, prazoPostagem: true,
      formatos: true, aprovacaoStatus: true, linkPublicado: true,
      cliente: { select: { nome: true, nomeFantasia: true } },
      status: { select: { nome: true, cor: true, isConcluido: true } },
    },
  });

  // Miniatura: primeiro anexo-imagem "atual" de cada job.
  const ids = posts.map((p) => p.id);
  const anexos = ids.length
    ? await db.anexo.findMany({
        where: { entidadeTipo: "job", entidadeId: { in: ids }, atual: true },
        orderBy: [{ versao: "desc" }, { criadoEm: "asc" }],
        select: { id: true, entidadeId: true, tipo: true, url: true, contentType: true },
      })
    : [];

  const thumbPorJob = new Map<string, { id: string; interno: boolean; url: string | null }>();
  for (const a of anexos) {
    if (thumbPorJob.has(a.entidadeId)) continue;
    const ehImagemArquivo = a.tipo === "arquivo" && !!a.contentType && a.contentType.startsWith("image/");
    const ehImagemLink =
      a.tipo === "link" && !!a.url && /(\.(png|jpe?g|webp|gif|avif)(\?|$)|[?&](fm|format)=(png|jpe?g|webp|gif|avif)\b|images\.unsplash\.com|res\.cloudinary\.com|picsum\.photos)/i.test(a.url);
    if (ehImagemArquivo) thumbPorJob.set(a.entidadeId, { id: a.id, interno: true, url: null });
    else if (ehImagemLink) thumbPorJob.set(a.entidadeId, { id: a.id, interno: false, url: a.url });
  }

  return posts.map((p) => {
    const t = thumbPorJob.get(p.id);
    const thumbUrl = t ? (t.interno ? `/api/anexos/${t.id}` : t.url) : null;
    return { ...p, thumbUrl };
  });
}
