import { db } from "@/lib/db";
import { extrairBearer, tokenValido } from "@/lib/integracoes/leads-site";
import { enviarEmail, emailConfigurado, layoutEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function escaparHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * POST /api/agentes/revisao-seguranca
 *
 * Recebe o relatório da revisão de segurança semanal (rodada por uma rotina na
 * nuvem) e o envia por e-mail aos administradores. É o canal de entrega do
 * relatório, que a rotina isolada não consegue fazer sozinha.
 *
 * Auth: header `Authorization: Bearer <TREM_REVISAO_SECRET>`. Segredo dedicado,
 * de baixo privilégio: quem o tiver só consegue disparar este e-mail, nada mais.
 */
export async function POST(req: Request) {
  const segredo = process.env.TREM_REVISAO_SECRET;
  if (!segredo) return json({ ok: false, error: "TREM_REVISAO_SECRET não configurado." }, 503);

  const recebido = extrairBearer(req.headers.get("authorization"));
  if (!recebido || !tokenValido(recebido, segredo)) return json({ ok: false, error: "não autorizado" }, 401);

  let corpo: { relatorio?: unknown; titulo?: unknown } = {};
  try {
    corpo = await req.json();
  } catch {
    return json({ ok: false, error: "corpo inválido" }, 400);
  }
  const relatorio = typeof corpo.relatorio === "string" ? corpo.relatorio.trim() : "";
  if (!relatorio) return json({ ok: false, error: "relatorio vazio" }, 400);

  const titulo = typeof corpo.titulo === "string" && corpo.titulo.trim() ? corpo.titulo.trim() : "Revisão de segurança semanal do TREM";

  if (!emailConfigurado()) return json({ ok: false, error: "e-mail não configurado no ambiente." }, 503);

  const admins = await db.usuario.findMany({
    where: { ativo: true, perfil: { capacidades: { some: { modulo: "admin", nivel: "ADMIN" } } } },
    select: { email: true },
  });
  const destinos = admins.map((a) => a.email).filter((e): e is string => !!e);
  if (destinos.length === 0) return json({ ok: false, error: "nenhum administrador com e-mail." }, 200);

  // Texto puro do relatório, preservando quebras de linha (é markdown/plain).
  const html = layoutEmail({
    titulo,
    corpo: `<pre style="white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.5;margin:0">${escaparHtml(relatorio.slice(0, 60000))}</pre>`,
    linkUrl: null,
  });

  const enviado = await enviarEmail({ to: destinos, subject: `${titulo} (${new Date().toLocaleDateString("pt-BR")})`, html });

  return json({ ok: enviado, enviados: enviado ? destinos.length : 0 });
}
