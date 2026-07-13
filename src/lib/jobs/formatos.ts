/** Formatos de postagem em rede social (seleção múltipla numa postagem). */
export const FORMATOS_POST: { key: string; label: string }[] = [
  { key: "instagram_feed", label: "Instagram — Feed" },
  { key: "stories", label: "Stories" },
  { key: "reels", label: "Reels (vídeo)" },
  { key: "reels_capa", label: "Capa de Reels" },
  { key: "carrossel", label: "Carrossel" },
  { key: "facebook", label: "Facebook" },
  { key: "youtube", label: "YouTube" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "outro", label: "Outro" },
];

const MAPA = new Map(FORMATOS_POST.map((f) => [f.key, f.label]));

export function rotuloFormato(key: string): string {
  return MAPA.get(key) ?? key;
}

/** "instagram_feed,stories" → ["Instagram — Feed", "Stories"] (ignora chaves desconhecidas). */
export function rotulosFormatos(formatos: string | null | undefined): string[] {
  if (!formatos) return [];
  return formatos.split(",").map((k) => k.trim()).filter((k) => MAPA.has(k)).map(rotuloFormato);
}
