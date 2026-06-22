import { db } from "@/lib/db";

export type ListarJobsOpts = {
  q?: string;
  statusId?: string;
  responsavelId?: string;
  clienteId?: string;
  projetoId?: string;
  minhasDoUsuario?: string; // id do usuário (Minha Pauta)
  incluirArquivados?: boolean;
};

export type JobListItem = Awaited<ReturnType<typeof listarJobs>>[number];

export async function listarStatus() {
  return db.jobStatus.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
  });
}

export async function listarJobs(opts: ListarJobsOpts = {}) {
  const where: Record<string, unknown> = {};
  if (!opts.incluirArquivados) where.arquivado = false;
  if (opts.statusId) where.statusId = opts.statusId;
  if (opts.responsavelId) where.responsavelId = opts.responsavelId;
  if (opts.minhasDoUsuario) where.responsavelId = opts.minhasDoUsuario;
  if (opts.clienteId) where.clienteId = opts.clienteId;
  if (opts.projetoId) where.projetoId = opts.projetoId;
  if (opts.q) {
    where.OR = [
      { titulo: { contains: opts.q, mode: "insensitive" } },
      { cliente: { nome: { contains: opts.q, mode: "insensitive" } } },
    ];
  }

  return db.job.findMany({
    where,
    orderBy: [{ prazo: { sort: "asc", nulls: "last" } }, { numero: "desc" }],
    include: {
      cliente: { select: { id: true, nome: true, nomeFantasia: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      status: true,
      bloqueadoPor: { select: { id: true, numero: true, titulo: true, concluidoEm: true } },
      _count: { select: { tarefas: true } },
    },
  });
}

export async function obterJob(id: string) {
  const job = await db.job.findUnique({
    where: { id },
    include: {
      cliente: { select: { id: true, nome: true } },
      projeto: { select: { id: true, numero: true, nome: true } },
      responsavel: { select: { id: true, nome: true } },
      criadoPor: { select: { id: true, nome: true } },
      status: true,
      bloqueadoPor: { select: { id: true, numero: true, titulo: true, concluidoEm: true } },
      bloqueia: { select: { id: true, numero: true, titulo: true }, orderBy: { numero: "desc" } },
      tarefas: {
        orderBy: [{ concluida: "asc" }, { ordem: "asc" }, { criadoEm: "asc" }],
        include: { responsavel: { select: { id: true, nome: true } } },
      },
      envolvidos: { include: { usuario: { select: { id: true, nome: true } } } },
    },
  });
  if (!job) return null;

  const agg = await db.apontamento.aggregate({
    where: { jobId: id },
    _sum: { minutos: true },
  });
  return { ...job, apontadoMin: agg._sum.minutos ?? 0 };
}

/** Projetos não arquivados para o select dependente (filtrado por cliente no client). */
export async function listarProjetosParaSelect() {
  return db.projeto.findMany({
    where: { arquivado: false },
    orderBy: { numero: "desc" },
    select: { id: true, numero: true, nome: true, clienteId: true },
  });
}

/** Jobs ativos para o select de dependência (filtrado por cliente no client). */
export async function listarJobsParaSelect() {
  return db.job.findMany({
    where: { arquivado: false },
    orderBy: { numero: "desc" },
    select: { id: true, numero: true, titulo: true, clienteId: true },
  });
}

/** Métrica de dashboard: % de jobs concluídos dentro do prazo. */
export async function metricaJobsNoPrazo() {
  const concluidos = await db.job.findMany({
    where: { concluidoEm: { not: null }, prazo: { not: null } },
    select: { concluidoEm: true, prazo: true },
  });
  if (concluidos.length === 0) return null;
  const noPrazo = concluidos.filter((j) => j.concluidoEm! <= j.prazo!).length;
  return {
    total: concluidos.length,
    noPrazo,
    pct: Math.round((noPrazo / concluidos.length) * 100),
  };
}
