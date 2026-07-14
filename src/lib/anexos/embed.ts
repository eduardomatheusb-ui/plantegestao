/**
 * Incorporação de anexos por link — hoje foco em Google Drive (Reels em vídeo).
 * Reaproveitado na tela de aprovação e no portal do cliente.
 */

/** Converte um link do Google Drive na URL de incorporação (/preview), ou null se não for Drive. */
export function driveEmbed(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/\/file\/d\/([^/?#]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  m = u.match(/[?&]id=([^&]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  if (/google\.com\/.*\/preview(\?|$)/.test(u)) return u; // já é um embed
  return null;
}

export const ehDriveLink = (url?: string | null): boolean =>
  !!url && /(?:drive|docs)\.google\.com/i.test(url);

/** Proporção do quadro conforme o tipo/formato da peça (Reels = 9:16). */
export function aspectoPeca(tipo?: string | null, formatos?: string | null): string {
  const s = `${tipo ?? ""} ${formatos ?? ""}`.toLowerCase();
  if (/reels|stor(?:y|ies)|tiktok|short|vertical/.test(s)) return "9 / 16";
  if (/feed|carrossel|carousel|quadrad|square/.test(s)) return "4 / 5";
  if (/video|motion|paisagem|land|16.?9/.test(s)) return "16 / 9";
  return "9 / 16";
}
