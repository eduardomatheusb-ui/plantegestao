import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Integração Site da Plante → CRM do TREM.
 * Cada landing page conhecida define origem/interesse/tags aplicados ao lead.
 * Landing desconhecida cai no genérico (origem "Site", tag "lead-site").
 */
export type LandingConfig = {
  origem: string;
  interesse: string | null;
  tags: string[];
};

export const LANDINGS: Record<string, LandingConfig> = {
  "guia-eca-digital": {
    origem: "Landing Guia ECA Digital",
    interesse: "Guia de uso responsável de imagens",
    tags: ["lead-site", "guia-eca-digital", "material-gratuito"],
  },
};

const LANDING_PADRAO: LandingConfig = {
  origem: "Site",
  interesse: null,
  tags: ["lead-site"],
};

export function configLanding(landingPage?: string | null): LandingConfig {
  const chave = (landingPage ?? "").trim().toLowerCase();
  // Casa por chave exata OU por "contém a chave" — funciona se vier a chave pura
  // ("guia-eca-digital"), o caminho ("/guia-eca-digital") ou a URL completa.
  for (const [key, cfg] of Object.entries(LANDINGS)) {
    if (chave === key || chave.includes(key)) return cfg;
  }
  return LANDING_PADRAO;
}

/** Compara o token recebido com o esperado em tempo constante (evita timing attack). */
export function tokenValido(recebido: string, esperado: string): boolean {
  const a = createHash("sha256").update(recebido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

/** Extrai "Bearer xxx" do header Authorization. */
export function extrairBearer(header: string | null): string | null {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export const normalizarEmail = (v: string) => v.trim().toLowerCase();

/**
 * Chave canônica para deduplicar por WhatsApp/telefone: só dígitos e, para
 * números BR, sem o código de país 55 (assim "+55 31 9…" e "31 9…" batem).
 */
export const normalizarFone = (v: string) => {
  let d = v.replace(/\D/g, "");
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2); // remove +55
  return d;
};

/** Interpreta os vários formatos de "aceite" (true, "true", "on", "1", "sim"). */
export function consentimentoAceito(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return ["true", "on", "1", "sim", "yes"].includes(v.trim().toLowerCase());
  return false;
}

/** Data amigável em pt-BR no fuso de São Paulo. */
export function dataHoraBR(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

type DadosObservacao = {
  cfg: LandingConfig;
  organization?: string | null;
  segment?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  consent_text?: string | null;
  consentEm: Date;
  utm: Record<string, string | null>;
  recebidoEm: Date;
};

/** Monta o bloco de observação (uma "interação") a partir dos dados recebidos. */
export function montarObservacao(d: DadosObservacao): string {
  const nd = (v?: string | null) => (v && v.trim() ? v.trim() : "—");
  const utm = ["source", "medium", "campaign", "content", "term"]
    .map((k) => `${k}=${d.utm[k]?.trim() || "—"}`)
    .join(" | ");
  return [
    `[Entrada pelo site — ${dataHoraBR(d.recebidoEm)}]`,
    `Origem: ${d.cfg.origem}`,
    d.cfg.interesse ? `Interesse: ${d.cfg.interesse}` : null,
    `Instituição/Organização: ${nd(d.organization)}`,
    `Segmento: ${nd(d.segment)}`,
    `Página: ${nd(d.landing_page)}`,
    `Referrer: ${nd(d.referrer)}`,
    `UTM: ${utm}`,
    `Consentimento LGPD: ${nd(d.consent_text)} (aceito em ${dataHoraBR(d.consentEm)})`,
  ]
    .filter(Boolean)
    .join("\n");
}
