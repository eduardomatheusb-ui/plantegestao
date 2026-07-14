/**
 * Incorporação de anexos por link — Google Drive (Reels em vídeo e pastas).
 * Reaproveitado na tela de aprovação e no portal do cliente.
 */

export type DriveEmbed = {
  /** "arquivo" → player /preview (proporção da peça); "pasta" → grade de arquivos. */
  tipo: "arquivo" | "pasta";
  src: string;
};

/** Interpreta um link do Google Drive e devolve a forma de incorporar (ou null). */
export function driveEmbedInfo(url?: string | null): DriveEmbed | null {
  if (!url) return null;
  const u = url.trim();

  // Pasta: /drive/folders/ID  ou  ...folderview?id=ID
  let m = u.match(/\/folders\/([^/?#]+)/) || u.match(/folderview\?[^#]*\bid=([^&#]+)/);
  if (m) return { tipo: "pasta", src: `https://drive.google.com/embeddedfolderview?id=${m[1]}#grid` };

  // Arquivo: /file/d/ID  ou  open?id=ID / uc?id=ID
  m = u.match(/\/file\/d\/([^/?#]+)/) || u.match(/[?&]id=([^&#]+)/);
  if (m) return { tipo: "arquivo", src: `https://drive.google.com/file/d/${m[1]}/preview` };

  // Já é um /preview do Google
  if (/google\.com\/.*\/preview(\?|$)/.test(u)) return { tipo: "arquivo", src: u };
  return null;
}

/** Só a URL de player de arquivo do Drive (quando é arquivo), senão null. */
export function driveEmbed(url?: string | null): string | null {
  const info = driveEmbedInfo(url);
  return info?.tipo === "arquivo" ? info.src : null;
}

export const ehDriveLink = (url?: string | null): boolean =>
  !!url && /(?:drive|docs)\.google\.com/i.test(url);

/** Proporção do quadro do player conforme o tipo/formato da peça (Reels = 9:16). */
export function aspectoPeca(tipo?: string | null, formatos?: string | null): string {
  const s = `${tipo ?? ""} ${formatos ?? ""}`.toLowerCase();
  if (/reels|stor(?:y|ies)|tiktok|short|vertical/.test(s)) return "9 / 16";
  if (/feed|carrossel|carousel|quadrad|square/.test(s)) return "4 / 5";
  if (/video|motion|paisagem|land|16.?9/.test(s)) return "16 / 9";
  return "9 / 16";
}
