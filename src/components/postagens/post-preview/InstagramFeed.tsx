import { Heart, MessageCircle, Send, Bookmark } from "lucide-react";
import type { PostPreviewProps } from "./PostPreview";
import { CabecalhoCliente, LegendaTruncada } from "./PreviewMoldura";

/** Preview fiel do feed do Instagram. Suporta múltiplas imagens (carrossel). */
export function InstagramFeed({ cliente, imagens, legenda }: PostPreviewProps) {
  const nome = cliente.nomeFantasia || cliente.nome || "";
  const capa = imagens[0];
  return (
    <div className="mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <CabecalhoCliente cliente={cliente} />
        <button aria-hidden="true" className="text-neutral-600" tabIndex={-1}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>
        </button>
      </div>

      {/* Mídia */}
      <div className="relative aspect-square w-full bg-neutral-100">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa.src} alt={capa.alt ?? "Post"} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-sm text-neutral-400">Sem imagem</div>
        )}
        {imagens.length > 1 && (
          <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">1/{imagens.length}</div>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between px-3 pt-2.5">
        <div className="flex items-center gap-3.5 text-neutral-900">
          <Heart className="size-6" strokeWidth={1.8} />
          <MessageCircle className="size-6" strokeWidth={1.8} />
          <Send className="size-6" strokeWidth={1.8} />
        </div>
        <Bookmark className="size-6 text-neutral-900" strokeWidth={1.8} />
      </div>

      {/* Curtidas + legenda */}
      <div className="space-y-1 px-3 pb-3.5 pt-2">
        <p className="text-[13px] font-semibold text-neutral-900">Curtido por muitas pessoas</p>
        <LegendaTruncada nome={nome} legenda={legenda} />
        <p className="text-[11px] uppercase tracking-wide text-neutral-400">agora</p>
      </div>
    </div>
  );
}
