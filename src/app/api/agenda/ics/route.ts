import { db } from "@/lib/db";
import { compromissosParaFeed } from "@/lib/agenda/queries";
import { rotuloTipo } from "@/lib/agenda/constants";

export const dynamic = "force-dynamic";

function esc(s: string) {
  return (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function utc(d: Date) {
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}
function diaLocal(d: Date) {
  const x = new Date(d);
  return `${x.getFullYear()}${String(x.getMonth() + 1).padStart(2, "0")}${String(x.getDate()).padStart(2, "0")}`;
}

/** Feed .ics da agenda compartilhada — assinatura no Google/Apple/Outlook (token secreto). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) return new Response("Token ausente", { status: 400 });

  const empresa = await db.empresa.findUnique({ where: { id: "singleton" }, select: { agendaIcsToken: true } });
  if (!empresa?.agendaIcsToken || empresa.agendaIcsToken !== token) {
    return new Response("Link inválido", { status: 403 });
  }

  const eventos = await compromissosParaFeed();
  const stamp = `${diaLocal(new Date())}T000000Z`;
  const linhas: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Plante//TREM Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:Agenda — Plante",
    "X-WR-TIMEZONE:America/Sao_Paulo",
  ];

  for (const e of eventos) {
    const cliente = e.cliente?.nomeFantasia || e.cliente?.nome || "";
    const resumo = `${e.titulo}${cliente ? ` — ${cliente}` : ""}`;
    linhas.push("BEGIN:VEVENT", `UID:${e.id}@trem.agenciaplante.com.br`, `DTSTAMP:${stamp}`);
    if (e.diaInteiro) {
      const prox = new Date(new Date(e.inicio).getTime() + 24 * 3600 * 1000);
      linhas.push(`DTSTART;VALUE=DATE:${diaLocal(e.inicio)}`, `DTEND;VALUE=DATE:${diaLocal(prox)}`);
    } else {
      const fim = e.fim ?? new Date(new Date(e.inicio).getTime() + 60 * 60 * 1000);
      linhas.push(`DTSTART:${utc(e.inicio)}`, `DTEND:${utc(fim)}`);
    }
    if (e.recorrenciaDias) {
      let rrule = `RRULE:FREQ=DAILY;INTERVAL=${e.recorrenciaDias}`;
      if (e.recorrenciaAte) rrule += `;UNTIL=${e.diaInteiro ? diaLocal(e.recorrenciaAte) : utc(e.recorrenciaAte)}`;
      linhas.push(rrule);
    }
    linhas.push(`SUMMARY:${esc(resumo)}`);
    const desc = [rotuloTipo(e.tipo), e.descricao].filter(Boolean).join(" — ");
    if (desc) linhas.push(`DESCRIPTION:${esc(desc)}`);
    if (e.local) linhas.push(`LOCATION:${esc(e.local)}`);
    linhas.push("END:VEVENT");
  }
  linhas.push("END:VCALENDAR");

  return new Response(linhas.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="agenda-plante.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
