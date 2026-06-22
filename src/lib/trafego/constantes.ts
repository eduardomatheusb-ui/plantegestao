export const PLATAFORMAS = [
  { key: "meta", label: "Meta (Facebook/Instagram)", cor: "#1877f2" },
  { key: "google", label: "Google Ads", cor: "#34a853" },
  { key: "tiktok", label: "TikTok Ads", cor: "#111111" },
  { key: "linkedin", label: "LinkedIn Ads", cor: "#0a66c2" },
  { key: "outro", label: "Outra", cor: "#6b7280" },
] as const;

export const CAMPANHA_STATUS = [
  { key: "ativa", label: "Ativa", cor: "#059669" },
  { key: "pausada", label: "Pausada", cor: "#d97706" },
  { key: "encerrada", label: "Encerrada", cor: "#6b7280" },
] as const;

export function rotuloPlataforma(k: string) {
  return PLATAFORMAS.find((p) => p.key === k)?.label ?? k;
}
export function corPlataforma(k: string) {
  return PLATAFORMAS.find((p) => p.key === k)?.cor ?? "#6b7280";
}
export function rotuloStatusCampanha(k: string) {
  return CAMPANHA_STATUS.find((s) => s.key === k)?.label ?? k;
}
export function corStatusCampanha(k: string) {
  return CAMPANHA_STATUS.find((s) => s.key === k)?.cor ?? "#6b7280";
}
