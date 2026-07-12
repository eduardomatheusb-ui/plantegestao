import { Heart, MessageCircle, Send, MoreHorizontal, Music2 } from "lucide-react";
import type { PostPreviewProps } from "./PostPreview";

/** Preview 9:16 do Reels — imagem full, overlay de UI. */
export function InstagramReels({ cliente, imagens, legenda }: PostPreviewProps) {
  const nome = cliente.nomeFantasia || cliente.nome || "";
  const capa = imagens[0];
  const legendaCurta = (legenda ?? "").trim().slice(0, 140);
  return (
    <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-lg" style={{ aspectRatio: "9/16" }}>
      {/* Mídia (imagem full) */}
      {capa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={capa.src} alt={capa.alt ?? "Reels"} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm text-white/50">Sem imagem</div>
      )}

      {/* Gradientes p/ legibilidade */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Topo */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-3 text-white">
        <p className="text-[13px] font-semibold">Reels</p>
        <MoreHorizontal className="size-5" />
      </div>

      {/* Ações verticais */}
      <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-4 text-white">
        <div className="flex flex-col items-center">
          <Heart className="size-6" strokeWidth={1.8} />
          <span className="text-[10px]">1.2k</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="size-6" strokeWidth={1.8} />
          <span className="text-[10px]">88</span>
        </div>
        <div className="flex flex-col items-center">
          <Send className="size-6" strokeWidth={1.8} />
          <span className="text-[10px]">36</span>
        </div>
      </div>

      {/* Rodapé */}
      <div className="absolute inset-x-0 bottom-0 space-y-1.5 px-3 pb-3 text-white">
        <p className="text-[13px] font-semibold">@{nome.replace(/\s+/g, "").toLowerCase() || "cliente"}</p>
        {legendaCurta && <p className="line-clamp-2 whitespace-pre-wrap text-[12px] leading-snug">{legendaCurta}</p>}
        <div className="flex items-center gap-1.5 text-[11px] text-white/90">
          <Music2 className="size-3.5" />
          <span className="truncate">Áudio original · {nome || "cliente"}</span>
        </div>
      </div>
    </div>
  );
}
