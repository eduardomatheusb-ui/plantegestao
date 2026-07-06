import "server-only";
import { db } from "@/lib/db";

/**
 * Dados PÚBLICOS do portal de um cliente (sem login, via token).
 * Expõe só o necessário — nada de valores financeiros, custos ou dados internos.
 */
export async function obterPortal(token: string) {
  const cliente = await db.cliente.findFirst({
    where: { OR: [{ portalSlug: token }, { portalToken: token }] },
    select: { id: true, nome: true, nomeFantasia: true, logoUrl: true },
  });
  if (!cliente) return null;

  const agora = new Date();

  const [jobs, postagens, aprovacoes] = await Promise.all([
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
  ]);

  return { cliente, jobs, postagens, aprovacoes };
}
