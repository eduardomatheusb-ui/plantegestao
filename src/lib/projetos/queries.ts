import { db } from "@/lib/db";
import type { ProjetoStatus } from "@prisma/client";

export type ListarProjetosOpts = {
  q?: string;
  status?: ProjetoStatus;
  clienteId?: string;
  favoritos?: boolean;
  incluirArquivados?: boolean;
  soTopLevel?: boolean;
};

export async function listarProjetos(opts: ListarProjetosOpts = {}) {
  const where: Record<string, unknown> = {};
  if (!opts.incluirArquivados) where.arquivado = false;
  if (opts.soTopLevel) where.projetoPaiId = null;
  if (opts.status) where.status = opts.status;
  if (opts.clienteId) where.clienteId = opts.clienteId;
  if (opts.favoritos) where.favorito = true;
  if (opts.q) {
    where.OR = [
      { nome: { contains: opts.q, mode: "insensitive" } },
      { cliente: { nome: { contains: opts.q, mode: "insensitive" } } },
    ];
  }

  return db.projeto.findMany({
    where,
    orderBy: [{ favorito: "desc" }, { numero: "desc" }],
    include: {
      cliente: { select: { id: true, nome: true, nomeFantasia: true } },
      responsavel: { select: { id: true, nome: true } },
      _count: { select: { subprojetos: true } },
    },
  });
}

export async function obterProjeto(id: string) {
  const projeto = await db.projeto.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true, nomeFantasia: true } },
      responsavel: { select: { id: true, nome: true } },
      criadoPor: { select: { id: true, nome: true } },
      pai: { select: { id: true, numero: true, nome: true } },
      envolvidos: {
        include: { usuario: { select: { id: true, nome: true, email: true } } },
        orderBy: { criadoEm: "asc" },
      },
      subprojetos: {
        include: { cliente: { select: { nome: true } } },
        orderBy: { numero: "desc" },
      },
    },
  });
  if (!projeto) return null;

  const agg = await db.apontamento.aggregate({
    where: { projetoId: id },
    _sum: { minutos: true },
  });

  return { ...projeto, apontadoMin: agg._sum.minutos ?? 0 };
}

/** Jobs (com status, responsável, envolvidos e subtarefas) ligados a um projeto. */
export async function listarJobsDoProjeto(projetoId: string) {
  return db.job.findMany({
    where: { projetoId, arquivado: false },
    orderBy: [{ prazoPostagem: "asc" }, { prazo: "asc" }, { numero: "asc" }],
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      prioridade: true,
      prazo: true,
      prazoPostagem: true,
      aprovacaoStatus: true,
      status: { select: { nome: true, cor: true, isConcluido: true } },
      responsavel: { select: { id: true, nome: true } },
      envolvidos: { select: { usuario: { select: { id: true, nome: true } } } },
      tarefas: {
        orderBy: { ordem: "asc" },
        select: { id: true, descricao: true, concluida: true, responsavel: { select: { nome: true } } },
      },
    },
  });
}

export type JobDoProjeto = Awaited<ReturnType<typeof listarJobsDoProjeto>>[number];

/** Usuários ativos para selects de responsável/envolvidos. */
export async function listarUsuariosAtivos() {
  return db.usuario.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true },
  });
}

/** Clientes não arquivados para selects/filtros. */
export async function listarClientesAtivos() {
  return db.cliente.findMany({
    where: { arquivado: false },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });
}
