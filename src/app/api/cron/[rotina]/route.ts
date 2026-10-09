import { db } from "@/lib/db";
import { extrairBearer, tokenValido } from "@/lib/integracoes/leads-site";
import { entregarResumoOperacional } from "@/lib/agentes/resumo";
import { alertasSemanais } from "@/lib/rotinas/alertas-semanais";
import { gerarRecorrencias } from "@/lib/rotinas/gerar-recorrencias";
import { notificarPrazos } from "@/lib/rotinas/notificar-prazos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const ROTINAS: Record<string, () => Promise<unknown>> = {
  "alertas-semanais": () => alertasSemanais(db),
  "gerar-recorrencias": () => gerarRecorrencias(db),
  "notificar-prazos": () => notificarPrazos(db),
  "resumo-operacional": () => entregarResumoOperacional({ forcar: false }),
};

/**
 * GET /api/cron/<rotina>
 *
 * Disparado pelos crons da Vercel (vercel.json), que mandam
 * `Authorization: Bearer <CRON_SECRET>`. Faz o papel das funções agendadas
 * do Netlify (netlify/functions), com a mesma lógica (src/lib/rotinas).
 */
export async function GET(req: Request, { params }: { params: Promise<{ rotina: string }> }) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) return json({ ok: false, error: "CRON_SECRET não configurado no ambiente." }, 503);

  const recebido = extrairBearer(req.headers.get("authorization"));
  if (!recebido || !tokenValido(recebido, segredo)) return json({ ok: false, error: "não autorizado" }, 401);

  const { rotina } = await params;
  const executar = ROTINAS[rotina];
  if (!executar) return json({ ok: false, error: "rotina desconhecida" }, 404);

  try {
    return json(await executar());
  } catch (err) {
    console.error(`[cron] ${rotina} falhou:`, err);
    return json({ ok: false, error: "falha ao executar a rotina" }, 500);
  }
}
