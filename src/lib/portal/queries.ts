import "server-only";
import { db } from "@/lib/db";

// Buckets de tipo de job para os contadores da "casa do cliente".
const BUCKET_POSTS = ["post_estatico", "carrossel", "story"];
const BUCKET_VIDEOS = ["reels", "video", "motion"];
const BUCKET_MATERIAIS = ["material_grafico", "identidade", "branding"];

/**
 * Dados PÚBLICOS do portal de um cliente (sem login, via token).
 * Expõe só o necessário — nada de valores financeiros, custos ou dados internos.
 */
export async function obterPortal(token: string) {
  const cliente = await db.cliente.findFirst({
    where: { OR: [{ portalSlug: token }, { portalToken: token }] },
    select: { id: true, nome: true, nomeFantasia: true, logoUrl: true, lookerEmbedUrl: true },
  });
  if (!cliente) return null;

  const agora = new Date();
  const iniMes = new Date(agora.getFullYear(), agora.getMonth(), 1, 0, 0, 0);
  const proxMes = new Date(agora.getFullYear(), agora.getMonth() + 1, 1, 0, 0, 0);
  const mesRaw = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(agora);
  const mesLabel = mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1);

  const [jobs, postagens, aprovacoes, publicadas, gruposTipo, producoesCount, minutosAgg, timelineJobs] = await Promise.all([
    // Jobs em andamento (não arquivados, não concluídos)
    db.job.findMany({
      where: { clienteId: cliente.id, arquivado: false, status: { isConcluido: false } },
      orderBy: [{ prazo: { sort: "asc", nulls: "last" } }, { numero: "desc" }],
      select: { id: true, numero: true, titulo: true, tipo: true, prazo: true, status: { select: { nome: true, cor: true } } },
    }),
    // Próximas postagens (data de publicação futura)
    db.job.findMany({
      where: { clienteId: cliente.id, arquivado: false, prazoPostagem: { gte: agora } },
      orderBy: { prazoPostagem: "asc" }, take: 20,
      select: { id: true, titulo: true, prazoPostagem: true, aprovacaoStatus: true, formatos: true },
    }),
    // Aprovações aguardando o cliente
    db.job.findMany({
      where: { clienteId: cliente.id, arquivado: false, aprovacaoStatus: "enviado", aprovacaoToken: { not: null } },
      orderBy: { aprovacaoEm: "desc" },
      select: { id: true, titulo: true, aprovacaoToken: true, prazoPostagem: true },
    }),
    // Postagens já publicadas (com link ao vivo, se houver)
    db.job.findMany({
      where: { clienteId: cliente.id, arquivado: false, publicadoEm: { not: null } },
      orderBy: { publicadoEm: "desc" }, take: 8,
      select: { id: true, titulo: true, publicadoEm: true, linkPublicado: true, formatos: true },
    }),
    // "O que fizemos juntos" — jobs concluídos neste mês, agrupados por tipo.
    db.job.groupBy({
      by: ["tipo"],
      where: { clienteId: cliente.id, arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
      _count: { _all: true },
    }),
    // Produções entregues/andando neste mês.
    db.producaoOrdem.count({
      where: { clienteId: cliente.id, status: { in: ["EM_ABERTO", "ENVIADA", "APROVADA"] }, criadoEm: { gte: iniMes, lt: proxMes } },
    }),
    // Minutos gravados no mês (vídeos concluídos).
    db.job.aggregate({
      _sum: { minutosGravados: true },
      where: { clienteId: cliente.id, arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
    }),
    // Linha do tempo: entregáveis (concluídos ou publicados), mais recentes primeiro.
    db.job.findMany({
      where: { clienteId: cliente.id, arquivado: false, OR: [{ concluidoEm: { not: null } }, { publicadoEm: { not: null } }] },
      orderBy: [{ publicadoEm: { sort: "desc", nulls: "last" } }, { concluidoEm: { sort: "desc", nulls: "last" } }],
      take: 24,
      select: { id: true, numero: true, titulo: true, tipo: true, publicadoEm: true, concluidoEm: true, linkPublicado: true },
    }),
  ]);

  // Soma os grupos de tipo nos baldes da casa do cliente.
  const somaBucket = (chaves: string[]) =>
    gruposTipo.filter((g) => chaves.includes(g.tipo)).reduce((s, g) => s + g._count._all, 0);
  const producao = {
    mesLabel,
    posts: somaBucket(BUCKET_POSTS),
    videos: somaBucket(BUCKET_VIDEOS),
    materiais: somaBucket(BUCKET_MATERIAIS),
    producoes: producoesCount,
    minutos: minutosAgg._sum.minutosGravados ?? 0,
  };

  // Cada item da timeline com a data que vale (publicado, senão concluído).
  const timeline = timelineJobs.map((j) => ({
    id: j.id,
    numero: j.numero,
    titulo: j.titulo,
    tipo: j.tipo,
    data: j.publicadoEm ?? j.concluidoEm,
    linkPublicado: j.linkPublicado,
  }));

  return { cliente, jobs, postagens, aprovacoes, publicadas, producao, timeline };
}
