import { db } from "@/lib/db";
import { enviarEmail, emailConfigurado, layoutEmail, baseUrl } from "@/lib/email";

export type NotificarArgs = {
  usuarioId: string;
  atorId?: string | null;
  tipo: string;
  titulo: string;
  descricao?: string | null;
  entidadeTipo?: string | null;
  entidadeId?: string | null;
  url?: string | null;
  /** Só notificação no sino, sem espelhar por e-mail (ex.: chat do mural geral). */
  semEmail?: boolean;
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
  if (!args.semEmail) await enviarEmailNotificacao(args);
}

/** Espelha a notificação por e-mail (best-effort; no-op se Resend não configurado). */
async function enviarEmailNotificacao(args: NotificarArgs): Promise<void> {
  if (!emailConfigurado()) return;
  try {
    const [u, ator] = await Promise.all([
      db.usuario.findUnique({ where: { id: args.usuarioId }, select: { email: true, ativo: true } }),
      args.atorId ? db.usuario.findUnique({ where: { id: args.atorId }, select: { nome: true } }) : Promise.resolve(null),
    ]);
    if (!u?.email || !u.ativo) return;
    const linkUrl = args.url ? `${baseUrl()}${args.url}` : null;
    const corpo = `${ator?.nome ? `<strong>${ator.nome}</strong> · ` : ""}${args.descricao ? `${args.descricao}` : "Você tem uma novidade no TREM."}`;
    await enviarEmail({
      to: u.email,
      subject: args.titulo,
      html: layoutEmail({ titulo: args.titulo, corpo, linkUrl }),
    });
  } catch (err) {
    console.error("[notif] falha ao enviar e-mail (ignorada):", err);
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
