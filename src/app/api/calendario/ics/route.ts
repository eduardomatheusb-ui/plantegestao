import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function diaICS(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${dia}`;
}
function esc(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Exporta as postagens programadas como calendário .ics (importar no Google/Apple Agenda). */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Não autorizado", { status: 401 });

  const agora = new Date();
  const inicio = new Date(agora.getTime() - 30 * 24 * 3600 * 1000);
  const fim = new Date(agora.getTime() + 180 * 24 * 3600 * 1000);

  const posts = await db.job.findMany({
    where: { arquivado: false, prazoPostagem: { gte: inicio, lte: fim } },
    orderBy: { prazoPostagem: "asc" },
    select: { id: true, titulo: true, prazoPostagem: true, cliente: { select: { nome: true, nomeFantasia: true } } },
  });

  const stamp = `${diaICS(agora)}T000000Z`;
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plante//TREM//PT-BR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Calendário editorial — Plante",
  ];

  for (const p of posts) {
    if (!p.prazoPostagem) continue;
    const d = new Date(p.prazoPostagem);
    const prox = new Date(d.getTime() + 24 * 3600 * 1000);
    const cliente = p.cliente?.nomeFantasia || p.cliente?.nome || "";
    linhas.push(
      "BEGIN:VEVENT",
      `UID:${p.id}@trem.agenciaplante.com.br`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${diaICS(d)}`,
      `DTEND;VALUE=DATE:${diaICS(prox)}`,
      `SUMMARY:${esc(p.titulo + (cliente ? ` — ${cliente}` : ""))}`,
      "END:VEVENT",
    );
  }
  linhas.push("END:VCALENDAR");

  return new Response(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendario-editorial.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
