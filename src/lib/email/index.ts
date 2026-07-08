import "server-only";

/**
 * Envio de e-mail via API do Resend (HTTP, sem SDK).
 * Plugável: se RESEND_API_KEY não estiver configurada, vira no-op silencioso
 * (útil em dev e enquanto o domínio não está verificado). NUNCA lança.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export function emailConfigurado(): boolean {
  return !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
}

/** Base absoluta do app (para links nos e-mails). */
export function baseUrl(): string {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.URL ?? "") || // URL é injetada pelo Netlify
    "https://trem.agenciaplante.com.br"
  ).replace(/\/$/, "");
}

export type EmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export async function enviarEmail(args: EmailArgs): Promise<boolean> {
  if (!emailConfigurado()) return false;
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
        ...(args.text ? { text: args.text } : {}),
      }),
    });
    if (!res.ok) {
      console.error("[email] Resend respondeu", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] falha ao enviar (ignorada):", err);
    return false;
  }
}

/** Monta um e-mail simples com a identidade da Plante (logo no cabeçalho). */
export function layoutEmail(opts: {
  titulo: string;
  corpo: string;
  linkUrl?: string | null;
  linkTexto?: string;
  rodape?: string;
}): string {
  const { titulo, corpo, linkUrl, linkTexto = "Abrir no sistema", rodape } = opts;
  const botao = linkUrl
    ? `<p style="margin:24px 0"><a href="${linkUrl}" style="background:#F7FF19;color:#050505;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;display:inline-block">${linkTexto}</a></p>`
    : "";
  const logo = `${baseUrl()}/brand/logo-email.png`;
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#050505;padding:18px 20px;border-radius:12px 12px 0 0">
      <img src="${logo}" alt="Plante" height="30" style="height:30px;display:block;border:0;outline:none;text-decoration:none" />
    </div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:20px">
      <h1 style="font-size:18px;margin:0 0 12px">${titulo}</h1>
      <div style="font-size:14px;line-height:1.6;color:#374151">${corpo}</div>
      ${botao}
    </div>
    ${rodape ? `<p style="font-size:11px;color:#9ca3af;text-align:center;margin-top:16px">${rodape}</p>` : ""}
  </div></body></html>`;
}
