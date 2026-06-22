import { PrismaClient } from "@prisma/client";

// Função agendada do Netlify: 1x/dia, gera cópias dos jobs recorrentes que venceram
// e agenda a próxima ocorrência. A cópia NÃO é recorrente (só o "gerador" é).
export default async () => {
  const db = new PrismaClient();
  try {
    const fimHoje = new Date();
    fimHoje.setHours(23, 59, 59, 999);
    let geradas = 0;

    const primeiro = await db.jobStatus.findFirst({ where: { ativo: true }, orderBy: { ordem: "asc" }, select: { id: true } });

    const geradores = await db.job.findMany({
      where: { recorrenciaFreq: { not: null }, recorrenciaProxima: { lte: fimHoje } },
      include: { tarefas: { orderBy: { ordem: "asc" } }, envolvidos: { select: { usuarioId: true } } },
    });

    for (const g of geradores) {
      const ocorrencia = g.recorrenciaProxima ?? new Date();
      // novo número sequencial (mesma lógica de lib/sequence)
      const rows = await db.$queryRaw<{ ultimo: number }[]>`
        INSERT INTO "Sequence" ("tipo", "ultimo") VALUES ('JOB', 1)
        ON CONFLICT ("tipo") DO UPDATE SET "ultimo" = "Sequence"."ultimo" + 1
        RETURNING "ultimo"`;
      const numero = rows[0].ultimo;

      await db.job.create({
        data: {
          numero,
          tipo: g.tipo,
          prioridade: g.prioridade,
          titulo: g.titulo,
          clienteId: g.clienteId,
          projetoId: g.projetoId,
          responsavelId: g.responsavelId,
          statusId: primeiro?.id ?? g.statusId,
          prazo: ocorrencia,
          legenda: g.legenda,
          formatos: g.formatos,
          briefing: g.briefing,
          criadoPorId: g.criadoPorId,
          tarefas: { create: g.tarefas.map((t) => ({ descricao: t.descricao, responsavelId: t.responsavelId, ordem: t.ordem, concluida: false })) },
          envolvidos: { create: g.envolvidos.map((e) => ({ usuarioId: e.usuarioId })) },
        },
      });
      geradas++;

      // agenda a próxima
      const prox = new Date(ocorrencia);
      if (g.recorrenciaFreq === "semanal") prox.setDate(prox.getDate() + 7);
      else if (g.recorrenciaFreq === "quinzenal") prox.setDate(prox.getDate() + 14);
      else prox.setMonth(prox.getMonth() + 1); // mensal
      await db.job.update({ where: { id: g.id }, data: { recorrenciaProxima: prox } });
    }

    return new Response(JSON.stringify({ ok: true, geradas }), { headers: { "content-type": "application/json" } });
  } finally {
    await db.$disconnect();
  }
};

// 11:30 UTC ≈ 08:30 (Brasília).
export const config = { schedule: "30 11 * * *" };
