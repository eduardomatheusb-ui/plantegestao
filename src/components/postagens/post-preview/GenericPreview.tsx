import type { PostPreviewProps } from "./PostPreview";
import { rotuloFormato } from "@/lib/jobs/formatos";

/** Fallback para redes sem mockup fiel (FB, LinkedIn, TikTok, YouTube, outro). */
export function GenericPreview({ formato, cliente, imagens, legenda }: PostPreviewProps) {
  const nome = cliente.nomeFantasia || cliente.nome || "";
  const capa = imagens[0];
  return (
    <div className="mx-auto w-full max-w-[440px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-neutral-500">{rotuloFormato(formato)}</p>
        <p className="truncate text-[12px] font-medium text-neutral-700">{nome}</p>
      </div>
      {capa && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={capa.src} alt={capa.alt ?? "Post"} className="w-full object-cover" />
      )}
      {legenda && (
        <p className="whitespace-pre-wrap px-4 py-3 text-[13px] leading-snug text-neutral-800">{legenda.trim()}</p>
      )}
      {imagens.length > 1 && (
        <p className="border-t border-neutral-100 px-4 py-2 text-[11px] text-neutral-500">
          + {imagens.length - 1} arquivo(s) adicional(is)
        </p>
      )}
    </div>
  );
}
