/**
 * Catálogo de TIPOS DE JOB (serviços da agência). Cada job tem um tipo.
 * `social: true` = peça de rede social → mostra campos extras (legenda, canais,
 * prazo de postagem). Lista em código; fácil de estender.
 */
export type TipoJob = { key: string; label: string; social: boolean };

export const TIPOS_JOB: TipoJob[] = [
  { key: "post_estatico", label: "Post estático", social: true },
  { key: "carrossel", label: "Carrossel", social: true },
  { key: "story", label: "Story", social: true },
  { key: "reels", label: "Reels / vídeo curto", social: true },
  { key: "video", label: "Vídeo", social: true },
  { key: "material_grafico", label: "Material gráfico", social: false },
  { key: "motion", label: "Motion / animação", social: false },
  { key: "identidade", label: "Identidade visual", social: false },
  { key: "web", label: "Site / landing page", social: false },
  { key: "trafego", label: "Tráfego pago / anúncio", social: false },
  { key: "branding", label: "Branding / estratégia", social: false },
  { key: "outro", label: "Outro", social: false },
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
