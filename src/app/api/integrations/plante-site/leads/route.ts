import { z } from "zod";
import { db } from "@/lib/db";
import { registrarLog } from "@/lib/log";
import {
  configLanding,
  consentimentoAceito,
  extrairBearer,
  montarObservacao,
  normalizarEmail,
  normalizarFone,
  tokenValido,
} from "@/lib/integracoes/leads-site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

const schema = z.object({
  name: z.string().trim().min(1, "name é obrigatório"),
  email: z.string().trim().email("email inválido"),
  // Opcional só no formulário de contato (telefone não obrigatório lá).
  whatsapp: z.string().trim().optional().nullable(),
  consent: z.unknown(),
  organization: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  consent_text: z.string().optional().nullable(),
  landing_page: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
  created_at: z.string().optional().nullable(),
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  utm_content: z.string().optional().nullable(),
  utm_term: z.string().optional().nullable(),
  message: z.string().max(5000).optional().nullable(),
  extras: z.record(z.string(), z.string().max(2000)).optional().nullable(),
});

/**
 * POST /api/integrations/plante-site/leads
 * Recebe leads do site da Plante e cria/atualiza no CRM.
 * Auth: header `Authorization: Bearer <TREM_WEBHOOK_SECRET>`.
 */
export async function POST(req: Request) {
  // 1) Integração configurada?
  const segredo = process.env.TREM_WEBHOOK_SECRET;
  if (!segredo) return json({ ok: false, error: "Integração não configurada." }, 503);

  // 2) Autenticação por token (timing-safe).
  const token = extrairBearer(req.headers.get("authorization"));
  if (!token || !tokenValido(token, segredo)) {
    return json({ ok: false, error: "Não autorizado." }, 401);
  }

  // 3) Corpo JSON.
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return json({ ok: false, error: "JSON inválido." }, 400);
  }

  // 4) Validação dos campos.
  const parsed = schema.safeParse(corpo);
  if (!parsed.success) {
    return json({ ok: false, error: parsed.error.issues[0]?.message ?? "Campos inválidos." }, 422);
  }
  const d = parsed.data;
  const cfg = configLanding(d.landing_page);
  const exigeConsentimento = cfg.exigeConsentimento !== false;

  if (exigeConsentimento && (d.whatsapp ?? "").replace(/\D/g, "").length < 8) {
    return json({ ok: false, error: "whatsapp inválido" }, 422);
  }

  // 5) Consentimento LGPD obrigatório (menos no pedido de contato).
  const consentiu = consentimentoAceito(d.consent);
  if (exigeConsentimento && !consentiu) {
    return json({ ok: false, error: "consent (aceite LGPD) é obrigatório." }, 422);
  }

  try {
    const recebidoEm = new Date();
    const dataEnvio = d.created_at ? new Date(d.created_at) : recebidoEm;
    const consentEm = consentiu ? (isNaN(dataEnvio.getTime()) ? recebidoEm : dataEnvio) : null;
    const emailNorm = normalizarEmail(d.email);
    const foneNorm = normalizarFone(d.whatsapp ?? "");

    const observacao = montarObservacao({
      cfg,
      organization: d.organization,
      segment: d.segment,
      landing_page: d.landing_page,
      referrer: d.referrer,
      consent_text: d.consent_text,
      consentEm,
      mensagem: d.message,
      extras: d.extras,
      utm: {
        source: d.utm_source ?? null,
        medium: d.utm_medium ?? null,
        campaign: d.utm_campaign ?? null,
        content: d.utm_content ?? null,
        term: d.utm_term ?? null,
      },
      recebidoEm,
    });

    // 6) Deduplicação por e-mail OU WhatsApp normalizado.
    const existente = await db.lead.findFirst({
      // Telefone vazio não entra na busca, senão casaria com qualquer lead sem telefone.
      where: { OR: [{ email: emailNorm }, ...(foneNorm ? [{ telefone: foneNorm }] : [])] },
      orderBy: { criadoEm: "asc" },
    });

    if (existente) {
      // Contato já existe: adiciona nova interação/origem sem duplicar.
      const tagsUnificadas = Array.from(new Set([...(existente.tags ?? []), ...cfg.tags]));
      const obsAcumulada = existente.observacao ? `${existente.observacao}\n\n${observacao}` : observacao;
      await db.lead.update({
        where: { id: existente.id },
        data: {
          // Preenche o que estiver faltando; não sobrescreve dados já qualificados.
          empresa: existente.empresa ?? (d.organization?.trim() || null),
          origem: existente.origem ?? cfg.origem,
          interesse: existente.interesse ?? cfg.interesse,
          tags: tagsUnificadas,
          observacao: obsAcumulada,
          telefone: existente.telefone || foneNorm || null,
          consentLgpd: existente.consentLgpd || consentiu,
          consentTexto: existente.consentTexto ?? (consentiu ? d.consent_text?.trim() || null : null),
          consentEm: existente.consentEm ?? consentEm,
        },
      });
      await registrarLog({
        entidadeTipo: "lead",
        entidadeId: existente.id,
        acao: `nova entrada pelo site (${cfg.origem})`,
      });
      return json({ ok: true, lead_id: existente.id, created: false, updated: true });
    }

    // 7) Novo lead.
    const criado = await db.lead.create({
      data: {
        nome: d.name.trim(),
        empresa: d.organization?.trim() || null,
        email: emailNorm,
        telefone: foneNorm || null,
        origem: cfg.origem,
        interesse: cfg.interesse,
        tags: cfg.tags,
        etapa: "novo",
        observacao,
        consentLgpd: consentiu,
        consentTexto: consentiu ? d.consent_text?.trim() || null : null,
        consentEm,
      },
    });
    await registrarLog({
      entidadeTipo: "lead",
      entidadeId: criado.id,
      acao: `entrada pelo site (${cfg.origem})`,
    });
    return json({ ok: true, lead_id: criado.id, created: true });
  } catch (e) {
    console.error("[integracao plante-site] erro:", e);
    return json({ ok: false, error: "Erro ao processar o lead." }, 500);
  }
}

/** Métodos diferentes de POST não são aceitos. */
export async function GET() {
  return json({ ok: false, error: "Use POST." }, 405);
}
