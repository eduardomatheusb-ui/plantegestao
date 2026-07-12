import type { PostPreviewProps } from "./PostPreview";
import { CabecalhoCliente } from "./PreviewMoldura";

/** Preview 9:16 do Stories — imagem full, barra de progresso e header simulados. */
export function InstagramStories({ cliente, imagens, legenda }: PostPreviewProps) {
  const capa = imagens[0];
  return (
    <div className="relative mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-lg" style={{ aspectRatio: "9/16" }}>
      {capa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={capa.src} alt={capa.alt ?? "Stories"} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center text-sm text-white/50">Sem imagem</div>
      )}

      {/* Barras de progresso (5 segmentos, o primeiro parcialmente preenchido) */}
      <div className="absolute inset-x-0 top-0 flex gap-1 px-2 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
            {i === 0 && <div className="h-full w-2/3 rounded-full bg-white" />}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute inset-x-0 top-3 px-3 pt-1.5 text-white">
        <CabecalhoCliente cliente={cliente} tema="escuro" />
      </div>

      {/* Legenda como sticker centralizado (opcional) */}
      {legenda && (
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 p-3 text-center text-[13px] font-semibold text-neutral-900 shadow">
          {legenda.trim().slice(0, 110)}
        </div>
      )}

      {/* Input de resposta simulado */}
      <div className="absolute inset-x-3 bottom-3 flex items-center gap-2">
        <div className="flex-1 rounded-full border border-white/60 px-3 py-2 text-[12px] text-white/80">
          Envie mensagem…
        </div>
      </div>
    </div>
  );
}
