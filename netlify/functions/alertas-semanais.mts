import { PrismaClient } from "@prisma/client";

// Função agendada do Netlify: 1x/semana (segunda 08h BRT) envia aos gestores
// um resumo de gestão — contratos vencendo, clientes parados, jobs sem responsável.
export default async () => {
  const db = new PrismaClient();
  try {
    const agora = new Date();
    const limiteContrato = new Date(agora.getTime() + 30 * 24 * 3600 * 1000);
    const limiteParado = new Date(agora.getTime() - 30 * 24 * 3600 * 1000);
    const dedup = new Date(agora.getTime() - 5 * 24 * 3600 * 1000); // não repetir em 5 dias

    const [contratos, clientes, jobsSemResp, gestores] = await Promise.all([
      db.contrato.count({ where: { status: "ativo", dataFim: { not: null, gte: agora, lte: limiteContrato } } }),
      db.cliente.findMany({
        where: { arquivado: false, status: "ativo" },
        select: { id: true, jobs: { where: { atualizadoEm: { gte: limiteParado } }, select: { id: true }, take: 1 } },
      }),
      db.job.count({ where: { arquivado: false, status: { isConcluido: false }, responsavelId: null } }),
      db.usuario.findMany({ where: { ativo: true, papel: { in: ["GESTOR", "SOCIO_DIRETOR"] } }, select: { id: true, nome: true, email: true } }),
    ]);

    const parados = clientes.filter((c) => c.jobs.length === 0).length;
    const total = contratos + parados + jobsSemResp;
    if (total === 0) {
      return new Response(JSON.stringify({ ok: true, total: 0, msg: "nada a alertar" }), { headers: { "content-type": "application/json" } });
    }

    const descricao = `${contratos} contrato(s) vencendo · ${parados} cliente(s) parado(s) · ${jobsSemResp} job(s) sem responsável`;
    const base = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.URL || "https://trem.agenciaplante.com.br").replace(/\/$/, "");
    const emailOn = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
    let criadas = 0;

    for (const g of gestores) {
      const ja = await db.notificacao.findFirst({ where: { usuarioId: g.id, tipo: "alerta", criadoEm: { gte: dedup } }, select: { id: true } });
      if (ja) continue;
      await db.notificacao.create({
        data: { usuarioId: g.id, tipo: "alerta", titulo: "Resumo semanal de gestão", descricao, entidadeTipo: "indicadores", url: "/indicadores" },
      });
      criadas++;

      if (emailOn && g.email) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM,
              to: [g.email],
              subject: "Resumo semanal de gestão — TREM",
              html: `<div style="font-family:Arial,sans-serif;color:#1a1a1a"><h2>Resumo semanal</h2><p>${descricao}.</p><p><a href="${base}/indicadores" style="background:#F7FF19;color:#050505;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;display:inline-block">Ver indicadores</a></p></div>`,
            }),
          });
        } catch { /* e-mail é best-effort */ }
      }
    }

    return new Response(JSON.stringify({ ok: true, total, criadas }), { headers: { "content-type": "application/json" } });
  } finally {
    await db.$disconnect();
  }
};

// 11:00 UTC ≈ 08:00 (Brasília) toda segunda-feira.
export const config = { schedule: "0 11 * * 1" };
