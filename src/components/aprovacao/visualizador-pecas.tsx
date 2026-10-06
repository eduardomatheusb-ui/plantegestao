"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Download, ExternalLink, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";
import type { PostPreviewImagem } from "@/components/postagens/post-preview/PostPreview";

/** Arquivo servido pela própria aplicação aceita ?download=1; link externo abre o original. */
function infoDownload(src: string) {
  const interno = src.startsWith("/api/");
  return { href: interno ? `${src}${src.includes("?") ? "&" : "?"}download=1` : src, externo: !interno };
}

type Vista = { s: number; x: number; y: number };

/**
 * Lista os arquivos de imagem da peça com as opções de ampliar e baixar.
 * Ampliar abre um visualizador em tela cheia com zoom (botões, roda do mouse,
 * pinça e toque duplo) e arraste para mover.
 */
export function VisualizadorPecas({ imagens, titulo = "Arquivos da peça" }: { imagens: PostPreviewImagem[]; titulo?: string }) {
  const [aberto, setAberto] = useState(false);
  const [indice, setIndice] = useState(0);
  if (imagens.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h2>
      <ul className={`grid grid-cols-1 gap-3 ${imagens.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {imagens.map((img, i) => {
          const dl = infoDownload(img.src);
          const nome = img.alt || `Arquivo ${i + 1}`;
          return (
            <li key={img.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                type="button"
                onClick={() => {
                  setIndice(i);
                  setAberto(true);
                }}
                className="group block w-full bg-muted/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
                aria-label={`Ampliar ${nome}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" className="mx-auto max-h-48 w-full object-contain p-2 transition-opacity group-hover:opacity-90" />
              </button>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3 py-2">
                <p className="min-w-0 flex-1 truncate text-sm font-medium" title={nome}>
                  {nome}
                </p>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIndice(i);
                      setAberto(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
                  >
                    <ZoomIn className="size-4" aria-hidden="true" />
                    Ampliar
                  </button>
                  <a
                    href={dl.href}
                    {...(dl.externo ? { target: "_blank", rel: "noopener noreferrer" } : { download: nome })}
                    className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold hover:bg-muted"
                  >
                    {dl.externo ? <ExternalLink className="size-4" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
                    {dl.externo ? "Abrir original" : "Baixar"}
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Visualizador imagens={imagens} indice={indice} onIndice={setIndice} aberto={aberto} onAberto={setAberto} />
    </section>
  );
}

function Visualizador({
  imagens,
  indice,
  onIndice,
  aberto,
  onAberto,
}: {
  imagens: PostPreviewImagem[];
  indice: number;
  onIndice: (i: number) => void;
  aberto: boolean;
  onAberto: (v: boolean) => void;
}) {
  const img = imagens[indice];
  const nome = img?.alt || `Arquivo ${indice + 1}`;
  const dl = img ? infoDownload(img.src) : null;
  const varias = imagens.length > 1;

  const [palco, setPalco] = useState<HTMLDivElement | null>(null);
  const [carregada, setCarregada] = useState<{ src: string; w: number; h: number } | null>(null);
  const nat = carregada && img && carregada.src === img.src ? carregada : null;
  const [vista, setVista] = useState<Vista>({ s: 1, x: 0, y: 0 });
  const [suave, setSuave] = useState(false);
  const vistaRef = useRef(vista);
  vistaRef.current = vista;

  const tamanho = useCallback(() => ({ w: palco?.clientWidth ?? 0, h: palco?.clientHeight ?? 0 }), [palco]);

  const ajuste = useCallback(() => {
    const t = tamanho();
    if (!nat || !t.w || !t.h) return 1;
    return Math.min(1, t.w / nat.w, t.h / nat.h);
  }, [nat, tamanho]);

  const limites = useCallback(() => {
    const fit = ajuste();
    return { min: fit, max: Math.max(2, fit * 6) };
  }, [ajuste]);

  const encaixar = useCallback(
    (v: Vista): Vista => {
      const t = tamanho();
      if (!nat) return v;
      const w = nat.w * v.s;
      const h = nat.h * v.s;
      const x = w <= t.w ? (t.w - w) / 2 : Math.min(0, Math.max(t.w - w, v.x));
      const y = h <= t.h ? (t.h - h) / 2 : Math.min(0, Math.max(t.h - h, v.y));
      return { s: v.s, x, y };
    },
    [nat, tamanho],
  );

  const aplicar = useCallback(
    (v: Vista, comTransicao: boolean) => {
      setSuave(comTransicao);
      setVista(encaixar(v));
    },
    [encaixar],
  );

  const ajustarTela = useCallback(() => aplicar({ s: ajuste(), x: 0, y: 0 }, true), [aplicar, ajuste]);

  const zoomEm = useCallback(
    (novaEscala: number, px: number, py: number, comTransicao: boolean) => {
      const { min, max } = limites();
      const v = vistaRef.current;
      const s = Math.max(min, Math.min(max, novaEscala));
      aplicar({ s, x: px - (px - v.x) * (s / v.s), y: py - (py - v.y) * (s / v.s) }, comTransicao);
    },
    [limites, aplicar],
  );

  const zoomCentro = useCallback(
    (fator: number) => {
      const t = tamanho();
      zoomEm(vistaRef.current.s * fator, t.w / 2, t.h / 2, true);
    },
    [tamanho, zoomEm],
  );

  // Ao abrir ou trocar de arquivo, mostra a imagem inteira.
  const chave = nat && palco ? `${nat.src}|${nat.w}x${nat.h}` : null;
  useEffect(() => {
    if (chave) ajustarTela();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, palco]);

  // Redimensionamento da janela mantém o zoom relativo.
  useEffect(() => {
    if (!palco) return;
    let fitAnterior = ajuste();
    const ro = new ResizeObserver(() => {
      const fit = ajuste();
      const rel = vistaRef.current.s / fitAnterior;
      fitAnterior = fit;
      aplicar({ ...vistaRef.current, s: Math.max(fit, fit * rel) }, false);
    });
    ro.observe(palco);
    return () => ro.disconnect();
  }, [palco, ajuste, aplicar]);

  // Roda do mouse e pinça do trackpad (precisa de listener não passivo).
  useEffect(() => {
    if (!palco) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = palco.getBoundingClientRect();
      const k = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      zoomEm(vistaRef.current.s * k, e.clientX - r.left, e.clientY - r.top, false);
    };
    palco.addEventListener("wheel", onWheel, { passive: false });
    return () => palco.removeEventListener("wheel", onWheel);
  }, [palco, zoomEm]);

  // Arrastar, pinça com dois dedos e toque duplo.
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const pinca = useRef<{ d: number; s: number } | null>(null);
  const moveu = useRef(false);
  const ultimoToque = useRef(0);
  const [arrastando, setArrastando] = useState(false);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moveu.current = false;
    if (ponteiros.current.size === 1) {
      ultimo.current = { x: e.clientX, y: e.clientY };
      setArrastando(true);
    }
    if (ponteiros.current.size === 2) {
      const [a, b] = Array.from(ponteiros.current.values());
      pinca.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: vistaRef.current.s };
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!ponteiros.current.has(e.pointerId) || !palco) return;
    ponteiros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = palco.getBoundingClientRect();
    if (ponteiros.current.size >= 2 && pinca.current) {
      const [a, b] = Array.from(ponteiros.current.values());
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      zoomEm(pinca.current.s * (d / pinca.current.d), (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, false);
      moveu.current = true;
    } else if (ultimo.current) {
      const dx = e.clientX - ultimo.current.x;
      const dy = e.clientY - ultimo.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) moveu.current = true;
      ultimo.current = { x: e.clientX, y: e.clientY };
      const v = vistaRef.current;
      aplicar({ s: v.s, x: v.x + dx, y: v.y + dy }, false);
    }
  }

  function onPointerEnd(e: React.PointerEvent<HTMLDivElement>) {
    if (!ponteiros.current.has(e.pointerId)) return;
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size < 2) pinca.current = null;
    if (ponteiros.current.size === 1) {
      const [p] = Array.from(ponteiros.current.values());
      ultimo.current = { x: p.x, y: p.y };
    }
    if (ponteiros.current.size === 0) {
      ultimo.current = null;
      setArrastando(false);
      if (e.type === "pointerup" && !moveu.current && palco) {
        const agora = Date.now();
        if (agora - ultimoToque.current < 320) {
          const r = palco.getBoundingClientRect();
          const fit = ajuste();
          if (vistaRef.current.s > fit * 1.5) ajustarTela();
          else zoomEm(fit * 3, e.clientX - r.left, e.clientY - r.top, true);
          ultimoToque.current = 0;
        } else {
          ultimoToque.current = agora;
        }
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const passo = 80;
    const v = vistaRef.current;
    if (e.key === "+" || e.key === "=") zoomCentro(1.4);
    else if (e.key === "-" || e.key === "_") zoomCentro(1 / 1.4);
    else if (e.key === "0") ajustarTela();
    else if (e.key === "ArrowLeft" && varias && v.s <= ajuste() * 1.01) onIndice((indice - 1 + imagens.length) % imagens.length);
    else if (e.key === "ArrowRight" && varias && v.s <= ajuste() * 1.01) onIndice((indice + 1) % imagens.length);
    else if (e.key === "ArrowLeft") aplicar({ ...v, x: v.x + passo }, true);
    else if (e.key === "ArrowRight") aplicar({ ...v, x: v.x - passo }, true);
    else if (e.key === "ArrowUp") aplicar({ ...v, y: v.y + passo }, true);
    else if (e.key === "ArrowDown") aplicar({ ...v, y: v.y - passo }, true);
    else return;
    e.preventDefault();
  }

  const { min, max } = nat ? limites() : { min: 1, max: 1 };
  const percentual = Math.round(vista.s * 100);
  const botao =
    "inline-flex size-10 items-center justify-center rounded-md text-neutral-100 hover:bg-white/10 disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F7FF19]";

  return (
    <DialogPrimitive.Root open={aberto} onOpenChange={onAberto}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-900" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col text-neutral-100 outline-none"
          onKeyDown={onKeyDown}
          aria-describedby={undefined}
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-neutral-900 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
            <DialogPrimitive.Title className="min-w-0 flex-1 truncate text-sm font-semibold">
              {nome}
              {varias && (
                <span className="ml-2 font-normal text-neutral-400">
                  {indice + 1} de {imagens.length}
                </span>
              )}
            </DialogPrimitive.Title>

            <div className="flex items-center gap-0.5" role="group" aria-label="Zoom">
              <button type="button" className={botao} onClick={() => zoomCentro(1 / 1.5)} disabled={!nat || vista.s <= min * 1.001} aria-label="Diminuir zoom">
                <ZoomOut className="size-5" aria-hidden="true" />
              </button>
              <span className="w-14 text-center text-xs font-semibold tabular-nums text-neutral-300" aria-live="polite">
                {nat ? `${percentual}%` : "…"}
              </span>
              <button type="button" className={botao} onClick={() => zoomCentro(1.5)} disabled={!nat || vista.s >= max * 0.999} aria-label="Aumentar zoom">
                <ZoomIn className="size-5" aria-hidden="true" />
              </button>
              <button type="button" className={botao} onClick={ajustarTela} disabled={!nat} aria-label="Ajustar à tela" title="Ajustar à tela">
                <Maximize2 className="size-5" aria-hidden="true" />
              </button>
            </div>

            {dl && (
              <a
                href={dl.href}
                {...(dl.externo ? { target: "_blank", rel: "noopener noreferrer" } : { download: nome })}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#F7FF19] px-3 text-sm font-semibold text-neutral-900 hover:bg-[#e9f00f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F7FF19]"
              >
                {dl.externo ? <ExternalLink className="size-4" aria-hidden="true" /> : <Download className="size-4" aria-hidden="true" />}
                <span className="hidden sm:inline">{dl.externo ? "Abrir original" : "Baixar"}</span>
              </a>
            )}

            <DialogPrimitive.Close className={botao} aria-label="Fechar">
              <X className="size-5" aria-hidden="true" />
            </DialogPrimitive.Close>
          </div>

          <div
            ref={setPalco}
            className={`relative flex-1 touch-none select-none overflow-hidden ${arrastando ? "cursor-grabbing" : "cursor-grab"}`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
          >
            {img && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.src}
                src={img.src}
                alt={nome}
                draggable={false}
                ref={(el) => {
                  if (el && el.complete && el.naturalWidth && carregada?.src !== img.src) {
                    setCarregada({ src: img.src, w: el.naturalWidth, h: el.naturalHeight });
                  }
                }}
                onLoad={(e) => setCarregada({ src: img.src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                className={`pointer-events-none absolute left-0 top-0 max-w-none origin-top-left ${suave ? "motion-safe:transition-transform motion-safe:duration-200" : ""} ${nat ? "" : "opacity-0"}`}
                style={nat ? { width: nat.w, height: nat.h, transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.s})` } : undefined}
              />
            )}
            {!nat && <p className="absolute inset-0 grid place-items-center text-sm text-neutral-400">Carregando…</p>}

            {varias && (
              <>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onIndice((indice - 1 + imagens.length) % imagens.length)}
                  className="absolute left-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-100 hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F7FF19]"
                  aria-label="Arquivo anterior"
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onIndice((indice + 1) % imagens.length)}
                  className="absolute right-2 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-100 hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#F7FF19]"
                  aria-label="Próximo arquivo"
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </button>
              </>
            )}
          </div>

          <p className="border-t border-white/10 bg-neutral-900 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-xs text-neutral-400">
            Arraste para mover. Use a roda do mouse, a pinça com dois dedos ou dois toques para ampliar.
          </p>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
