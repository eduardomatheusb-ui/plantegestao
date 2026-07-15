import { db } from "@/lib/db";

/** Limites do dia de hoje (servidor em horário local UTC-3). */
function hoje() {
  const ini = new Date();
  ini.setHours(0, 0, 0, 0);
  const fim = new Date();
  fim.setHours(23, 59, 59, 999);
  return { ini, fim };
}

/** Aniversariantes do mês (colaboradores ativos), ordenados pelo dia. */
export async function aniversariantesDoMes(): Promise<{ id: string; nome: string; dia: number }[]> {
  const mes = new Date().getMonth() + 1;
  try {
    return await db.$queryRaw<{ id: string; nome: string; dia: number }[]>`
      SELECT id, nome, EXTRACT(DAY FROM "dataNascimento")::int AS dia
      FROM "Colaborador"
      WHERE ativo = true AND "dataNascimento" IS NOT NULL
        AND EXTRACT(MONTH FROM "dataNascimento") = ${mes}
      ORDER BY dia ASC, nome ASC
    `;
  } catch {
    return [];
  }
}

/** Minha pauta: meus jobs ainda não concluídos, mais urgentes primeiro. */
export async function minhaPauta(userId: string) {
  const jobs = await db.job.findMany({
    // Responsável OU envolvido: a pauta mostra tudo que é meu, não só o que eu subi.
    where: { arquivado: false, status: { isConcluido: false }, OR: [{ responsavelId: userId }, { envolvidos: { some: { usuarioId: userId } } }] },
    orderBy: [{ prazo: { sort: "asc", nulls: "last" } }],
    take: 6,
    include: { cliente: { select: { nome: true } }, status: { select: { nome: true, cor: true } } },
  });
  return jobs.map((j) => ({
    id: j.id,
    numero: j.numero,
    titulo: j.titulo,
    clienteNome: j.cliente.nome,
    statusNome: j.status.nome,
    statusCor: j.status.cor,
    prazo: j.prazo,
  }));
}

/** Meus projetos: favoritos e os que sou responsável. */
export async function meusProjetos(userId: string) {
  const projetos = await db.projeto.findMany({
    where: { arquivado: false, OR: [{ favorito: true }, { responsavelId: userId }] },
    orderBy: [{ favorito: "desc" }, { atualizadoEm: "desc" }],
    take: 6,
    include: { cliente: { select: { nome: true } } },
  });
  return projetos.map((p) => ({
    id: p.id,
    numero: p.numero,
    nome: p.nome,
    clienteNome: p.cliente.nome,
    favorito: p.favorito,
  }));
}

/** Meus apontamentos de hoje (timesheet). */
export async function timesheetHoje(userId: string) {
  const { ini, fim } = hoje();
  const apts = await db.apontamento.findMany({
    where: { usuarioId: userId, data: { gte: ini, lte: fim } },
    orderBy: { criadoEm: "desc" },
    include: { job: { select: { titulo: true } }, projeto: { select: { nome: true } } },
  });
  const totalMin = apts.reduce((s, a) => s + a.minutos, 0);
  return {
    totalMin,
    itens: apts.map((a) => ({
      id: a.id,
      minutos: a.minutos,
      descricao: a.descricao,
      alvo: a.job?.titulo ?? a.projeto?.nome ?? "—",
    })),
  };
}

type DocRecente = { tipo: string; numero: number; titulo: string; atualizadoEm: Date; href: string };

/** Últimos documentos que sou responsável, em todos os módulos. */
export async function ultimosDocumentos(userId: string): Promise<DocRecente[]> {
  const [jobs, propostas, midia, producao] = await Promise.all([
    db.job.findMany({ where: { responsavelId: userId }, orderBy: { atualizadoEm: "desc" }, take: 5, select: { id: true, numero: true, titulo: true, atualizadoEm: true } }),
    db.proposta.findMany({ where: { responsavelId: userId }, orderBy: { atualizadoEm: "desc" }, take: 5, select: { id: true, numero: true, titulo: true, atualizadoEm: true } }),
    db.midiaPlano.findMany({ where: { responsavelId: userId }, orderBy: { atualizadoEm: "desc" }, take: 5, select: { id: true, numero: true, titulo: true, atualizadoEm: true } }),
    db.producaoOrdem.findMany({ where: { responsavelId: userId }, orderBy: { atualizadoEm: "desc" }, take: 5, select: { id: true, numero: true, titulo: true, atualizadoEm: true } }),
  ]);
  const docs: DocRecente[] = [
    ...jobs.map((d) => ({ tipo: "Job", numero: d.numero, titulo: d.titulo, atualizadoEm: d.atualizadoEm, href: `/jobs/${d.id}` })),
    ...propostas.map((d) => ({ tipo: "Proposta", numero: d.numero, titulo: d.titulo, atualizadoEm: d.atualizadoEm, href: `/propostas/${d.id}` })),
    ...midia.map((d) => ({ tipo: "Mídia", numero: d.numero, titulo: d.titulo, atualizadoEm: d.atualizadoEm, href: `/midia/${d.id}` })),
    ...producao.map((d) => ({ tipo: "Produção", numero: d.numero, titulo: d.titulo, atualizadoEm: d.atualizadoEm, href: `/producao/${d.id}` })),
  ];
  return docs.sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()).slice(0, 6);
}

/** Comentários mais recentes do sistema. */
export async function comentariosRecentes() {
  const TIPO_LABEL: Record<string, string> = { projeto: "Projeto", job: "Job", proposta: "Proposta", midia: "Mídia", producao: "Produção" };
  // Rota de detalhe por tipo de entidade (para o comentário virar link).
  const TIPO_ROTA: Record<string, string> = { projeto: "/projetos", job: "/jobs", proposta: "/propostas", midia: "/midia", producao: "/producao" };
  const cs = await db.comentario.findMany({
    orderBy: { criadoEm: "desc" },
    take: 5,
    include: { autor: { select: { nome: true } } },
  });
  return cs.map((c) => ({
    id: c.id,
    autorNome: c.autor?.nome ?? "Alguém",
    texto: c.texto,
    contexto: TIPO_LABEL[c.entidadeTipo] ?? c.entidadeTipo,
    href: TIPO_ROTA[c.entidadeTipo] ? `${TIPO_ROTA[c.entidadeTipo]}/${c.entidadeId}` : null,
    criadoEm: c.criadoEm,
  }));
}

/** Contadores de documentos pendentes por módulo + total em atraso (meu). */
export async function contadores(userId: string) {
  const agora = new Date();
  const [propostas, producao, midia, jobsAtraso, propAtraso, midiaAtraso, prodAtraso] = await Promise.all([
    db.proposta.count({ where: { status: { in: ["EM_ABERTO", "ENVIADA"] }, criadoPorId: userId } }),
    db.producaoOrdem.count({ where: { status: { in: ["EM_ABERTO", "ENVIADA"] }, OR: [{ criadoPorId: userId }, { responsavelId: userId }] } }),
    db.midiaPlano.count({ where: { status: { in: ["EM_ABERTO", "ENVIADA"] }, OR: [{ criadoPorId: userId }, { responsavelId: userId }] } }),
    db.job.count({ where: { responsavelId: userId, arquivado: false, status: { isConcluido: false }, prazo: { lt: agora } } }),
    db.proposta.count({ where: { responsavelId: userId, status: { in: ["EM_ABERTO", "ENVIADA"] }, prazo: { lt: agora } } }),
    db.midiaPlano.count({ where: { responsavelId: userId, status: { in: ["EM_ABERTO", "ENVIADA"] }, prazo: { lt: agora } } }),
    db.producaoOrdem.count({ where: { responsavelId: userId, status: { in: ["EM_ABERTO", "ENVIADA"] }, dataEntrega: { lt: agora } } }),
  ]);
  return {
    propostas,
    producao,
    midia,
    emAtraso: jobsAtraso + propAtraso + midiaAtraso + prodAtraso,
  };
}
