/** Buckets do escopo contratado (Estação do Cliente — contratado × utilizado). */
export const BUCKETS_ESCOPO = [
  { key: "posts", label: "Posts", unidade: "un" },
  { key: "videos", label: "Vídeos", unidade: "un" },
  { key: "materiais", label: "Materiais gráficos", unidade: "un" },
  { key: "campanhas", label: "Campanhas", unidade: "un" },
  { key: "reunioes", label: "Reuniões", unidade: "un" },
  { key: "horas_captacao", label: "Horas de captação", unidade: "horas" },
  { key: "outro", label: "Outro (conta manual)", unidade: "un" },
] as const;

export type BucketEscopo = (typeof BUCKETS_ESCOPO)[number]["key"];

/** Tipos de job que alimentam cada bucket automático (mesma régua da casa do cliente). */
export const BUCKET_TIPOS: Record<string, string[]> = {
  posts: ["post_estatico", "carrossel", "story"],
  videos: ["reels", "video", "motion"],
  materiais: ["material_grafico", "identidade", "branding"],
};

export function rotuloBucket(key: string): string {
  return BUCKETS_ESCOPO.find((b) => b.key === key)?.label ?? key;
}
