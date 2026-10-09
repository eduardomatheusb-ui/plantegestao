import type { PrismaClient } from "@prisma/client";

// Cria notificações de prazo (vencendo hoje / atrasado) para o responsável, sem repetir no mesmo dia.
// Usada pelo cron da Vercel (/api/cron/notificar-prazos) e pela função agendada do Netlify.
export async function notificarPrazos(db: PrismaClient) {
  const agora = new Date();
  const fimHoje = new Date();
  fimHoje.setHours(23, 59, 59, 999);
  const limiteDedup = new Date(Date.now() - 20 * 3600 * 1000); // não repetir nas últimas 20h
  let criadas = 0;

  async function avisar(
    usuarioId: string | null,
    entidadeTipo: string,
    entidadeId: string,
    rotulo: string,
    url: string,
    prazo: Date | null,
  ) {
    if (!usuarioId) return;
    const jaAvisado = await db.notificacao.findFirst({
      where: { usuarioId, entidadeTipo, entidadeId, tipo: "prazo", criadoEm: { gte: limiteDedup } },
      select: { id: true },
    });
    if (jaAvisado) return;
    const atrasado = !!prazo && prazo < agora;
    await db.notificacao.create({
      data: {
        usuarioId,
        tipo: "prazo",
        titulo: `${rotulo} ${atrasado ? "está atrasado" : "vence hoje"}`,
        descricao: atrasado ? "Prazo vencido" : "Vence hoje",
        entidadeTipo,
        entidadeId,
        url,
      },
    });
    criadas++;
  }

  const jobs = await db.job.findMany({
    where: { arquivado: false, status: { isConcluido: false }, prazo: { lte: fimHoje }, responsavelId: { not: null } },
    select: { id: true, titulo: true, prazo: true, responsavelId: true },
  });
  for (const j of jobs) await avisar(j.responsavelId, "job", j.id, `Job "${j.titulo}"`, `/jobs/${j.id}`, j.prazo);

  const propostas = await db.proposta.findMany({
    where: { status: { in: ["EM_ABERTO", "ENVIADA"] }, prazo: { lte: fimHoje }, responsavelId: { not: null } },
    select: { id: true, titulo: true, prazo: true, responsavelId: true },
  });
  for (const p of propostas) await avisar(p.responsavelId, "proposta", p.id, `Proposta "${p.titulo}"`, `/propostas/${p.id}`, p.prazo);

  const midia = await db.midiaPlano.findMany({
    where: { status: { in: ["EM_ABERTO", "ENVIADA"] }, prazo: { lte: fimHoje }, responsavelId: { not: null } },
    select: { id: true, titulo: true, prazo: true, responsavelId: true },
  });
  for (const m of midia) await avisar(m.responsavelId, "midia", m.id, `Mídia "${m.titulo}"`, `/midia/${m.id}`, m.prazo);

  const os = await db.ordemServico.findMany({
    where: { status: { in: ["RASCUNHO", "EMITIDA"] }, vencimento: { lte: fimHoje }, responsavelId: { not: null } },
    select: { id: true, titulo: true, vencimento: true, responsavelId: true },
  });
  for (const o of os) await avisar(o.responsavelId, "os", o.id, `OS "${o.titulo}"`, `/os/${o.id}`, o.vencimento);

  return { ok: true, criadas };
}
