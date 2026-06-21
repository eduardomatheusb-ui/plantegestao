import { db } from "@/lib/db";

export type NotificarArgs = {
  usuarioId: string;
  atorId?: string | null;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  url?: string | null;
};

/**
 * Cria uma notificação. Nunca notifica o próprio autor da ação.
 * NUNCA quebra a operação principal (try/catch) — igual à auditoria.
 */
export async function notificar(args: NotificarArgs): Promise<void> {
  if (args.atorId && args.atorId === args.usuarioId) return;
  try {
    await db.notificacao.create({
      data: {
        usuarioId: args.usuarioId,
        atorId: args.atorId ?? null,
        tipo: args.tipo,
        titulo: args.titulo,
        descricao: args.descricao ?? null,
        entidadeTipo: args.entidadeTipo ?? null,
        entidadeId: args.entidadeId ?? null,
        url: args.url ?? null,
      },
    });
  } catch (err) {
    console.error("[notif] falha ao notificar (ignorada):", err);
  }
}

/** Notifica vários usuários (dedup + pula o autor). */
export async function notificarMuitos(usuarioIds: (string | null | undefined)[], args: Omit<NotificarArgs, "usuarioId">): Promise<void> {
  const unicos = [...new Set(usuarioIds.filter((x): x is string => !!x))];
  for (const usuarioId of unicos) {
    await notificar({ ...args, usuarioId });
  }
}

/** Quem deve ser avisado de atividade numa entidade: responsável + (projeto) envolvidos. */
export async function destinatariosDaEntidade(entidadeTipo: string, entidadeId: string): Promise<string[]> {
  const ids = new Set<string>();
  try {
    if (entidadeTipo === "projeto") {
      const p = await db.projeto.findUnique({
        where: { id: entidadeId },
        select: { responsavelId: true, envolvidos: { select: { usuarioId: true } } },
      });
      if (p?.responsavelId) ids.add(p.responsavelId);
      p?.envolvidos.forEach((e) => ids.add(e.usuarioId));
    } else if (entidadeTipo === "job") {
      const j = await db.job.findUnique({ where: { id: entidadeId }, select: { responsavelId: true } });
      if (j?.responsavelId) ids.add(j.responsavelId);
    } else if (entidadeTipo === "proposta") {
      const p = await db.proposta.findUnique({ where: { id: entidadeId }, select: { responsavelId: true } });
      if (p?.responsavelId) ids.add(p.responsavelId);
    } else if (entidadeTipo === "midia") {
      const m = await db.midiaPlano.findUnique({ where: { id: entidadeId }, select: { responsavelId: true } });
      if (m?.responsavelId) ids.add(m.responsavelId);
    } else if (entidadeTipo === "producao") {
      const o = await db.producaoOrdem.findUnique({ where: { id: entidadeId }, select: { responsavelId: true } });
      if (o?.responsavelId) ids.add(o.responsavelId);
    }
  } catch (err) {
    console.error("[notif] destinatarios falhou:", err);
  }
  return [...ids];
}

// ─────────────────────────── Leitura ───────────────────────────

export async function listarNotificacoes(usuarioId: string, limite = 30) {
  return db.notificacao.findMany({
    where: { usuarioId },
    orderBy: { criadoEm: "desc" },
    take: limite,
    include: { ator: { select: { nome: true } } },
  });
}

export async function contarNaoLidas(usuarioId: string): Promise<number> {
  return db.notificacao.count({ where: { usuarioId, lida: false } });
}
