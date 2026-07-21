import { extrairBearer, tokenValido } from "@/lib/integracoes/leads-site";
import { entregarResumoOperacional, gerarResumoOperacional } from "@/lib/agentes/resumo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * POST /api/agentes/resumo-operacional
 *
 * Gera e entrega o resumo de operações (notificação + e-mail) para a direção.
 * Quem chama é a função agendada do Netlify — por isso não usa sessão.
 * Auth: header `Authorization: Bearer <TREM_CRON_SECRET>`.
 *
 * `?forcar=1` ignora a trava de 20h (para testar sem esperar o dia seguinte).
 * `?teste=1` devolve o texto do resumo SEM notificar nem enviar e-mail.
 */
export async function POST(req: Request) {
  const segredo = process.env.TREM_CRON_SECRET;
  if (!segredo) return json({ ok: false, error: "TREM_CRON_SECRET não configurado no ambiente." }, 503);

  const recebido = extrairBearer(req.headers.get("authorization"));
  if (!recebido || !tokenValido(recebido, segredo)) return json({ ok: false, error: "não autorizado" }, 401);

  const params = new URL(req.url).searchParams;
  const forcar = params.get("forcar") === "1";

  if (params.get("teste") === "1") {
    const { texto, comIA, titulo, descricao } = await gerarResumoOperacional();
    return json({ ok: true, teste: true, comIA, titulo, descricao, texto });
  }

  try {
    const r = await entregarResumoOperacional({ forcar });
    return json({ ok: true, ...r });
  } catch (err) {
    console.error("[resumo-operacional] falhou:", err);
    return json({ ok: false, error: "falha ao gerar o resumo" }, 500);
  }
}
