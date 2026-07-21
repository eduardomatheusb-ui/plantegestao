// Função agendada do Netlify: todo dia útil às 8h BRT (11h UTC) pede ao TREM
// o resumo de operações e a entrega para a direção (notificação + e-mail).
//
// Aqui não há lógica de negócio de propósito: a montagem do pacote e o texto
// vivem no app (src/lib/agentes), que é onde estão o Prisma, as permissões e a
// camada de IA. Esta função só puxa o gatilho na hora certa.
export default async () => {
  const base = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    "https://trem.agenciaplante.com.br"
  ).replace(/\/$/, "");

  const segredo = process.env.TREM_CRON_SECRET;
  if (!segredo) {
    return new Response(JSON.stringify({ ok: false, error: "TREM_CRON_SECRET ausente" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const res = await fetch(`${base}/api/agentes/resumo-operacional`, {
      method: "POST",
      headers: { Authorization: `Bearer ${segredo}` },
    });
    const corpo = await res.text();
    return new Response(corpo, { status: res.status, headers: { "content-type": "application/json" } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "falha de rede";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};

// Segunda a sexta, 11h UTC = 8h no horário de Brasília.
export const config = { schedule: "0 11 * * 1-5" };
