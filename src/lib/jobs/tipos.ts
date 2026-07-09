/**
 * Catálogo de TIPOS DE JOB (serviços da agência). Cada job tem um tipo.
 * `social: true` = peça de rede social → mostra campos extras (legenda, canais,
 * prazo de postagem). Lista em código; fácil de estender.
 */
export type TipoJob = { key: string; label: string; social: boolean; cor: string };

// Cor por tipo (nível ~600 do Tailwind: boa leitura no claro e no escuro).
export const TIPOS_JOB: TipoJob[] = [
  { key: "post_estatico", label: "Post estático", social: true, cor: "#db2777" },
  { key: "carrossel", label: "Carrossel", social: true, cor: "#7c3aed" },
  { key: "story", label: "Story", social: true, cor: "#d97706" },
  { key: "reels", label: "Reels / vídeo curto", social: true, cor: "#dc2626" },
  { key: "video", label: "Vídeo", social: true, cor: "#e11d48" },
  { key: "material_grafico", label: "Material gráfico", social: false, cor: "#0284c7" },
  { key: "motion", label: "Motion / animação", social: false, cor: "#0891b2" },
  { key: "identidade", label: "Identidade visual", social: false, cor: "#0d9488" },
  { key: "web", label: "Site / landing page", social: false, cor: "#4f46e5" },
  { key: "trafego", label: "Tráfego pago / anúncio", social: false, cor: "#65a30d" },
  { key: "branding", label: "Branding / estratégia", social: false, cor: "#9333ea" },
  { key: "outro", label: "Outro", social: false, cor: "#64748b" },
];

export const TIPO_JOB_PADRAO = "post_estatico";

const MAPA = new Map(TIPOS_JOB.map((t) => [t.key, t]));

export function rotuloTipoJob(key: string | null | undefined): string {
  return (key && MAPA.get(key)?.label) || "Job";
}

/** O tipo é de rede social (mostra legenda/canais/prazo de postagem)? */
export function tipoJobSocial(key: string | null | undefined): boolean {
  return !!key && (MAPA.get(key)?.social ?? false);
}

/** Cor do tipo de job (para borda/etiqueta nas pautas). */
export function corTipoJob(key: string | null | undefined): string {
  return (key && MAPA.get(key)?.cor) || "#64748b";
}
