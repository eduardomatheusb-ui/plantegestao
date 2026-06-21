"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { buscarGlobal, type BuscaGrupo } from "@/lib/busca/actions";
import { cn } from "@/lib/utils";

export function BuscaGlobal() {
  const router = useRouter();
  const [termo, setTermo] = React.useState("");
  const [grupos, setGrupos] = React.useState<BuscaGrupo[]>([]);
  const [aberto, setAberto] = React.useState(false);
  const [carregando, setCarregando] = React.useState(false);
  const [ativo, setAtivo] = React.useState(0);
  const boxRef = React.useRef<HTMLDivElement>(null);

  // Lista achatada (para navegação por teclado) na ordem que aparece.
  const planos = React.useMemo(
    () => grupos.flatMap((g) => g.itens.map((it) => ({ ...it, grupo: g.label }))),
    [grupos],
  );

  // Busca com debounce.
  React.useEffect(() => {
    const q = termo.trim();
    if (q.length < 2) { setGrupos([]); setCarregando(false); return; }
    setCarregando(true);
    const t = setTimeout(async () => {
      try {
        const r = await buscarGlobal(q);
        setGrupos(r);
        setAtivo(0);
        setAberto(true);
      } finally {
        setCarregando(false);
      }
    }, 280);
    return () => clearTimeout(t);
  }, [termo]);

  // Fechar ao clicar fora.
  React.useEffect(() => {
    function fora(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function ir(url: string) {
    setAberto(false);
    setTermo("");
    setGrupos([]);
    router.push(url);
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") { setAberto(false); return; }
    if (!planos.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setAberto(true); setAtivo((i) => (i + 1) % planos.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setAtivo((i) => (i - 1 + planos.length) % planos.length); }
    else if (e.key === "Enter") { e.preventDefault(); const it = planos[ativo]; if (it) ir(it.url); }
  }

  const temResultado = planos.length > 0;
  const mostrarPainel = aberto && termo.trim().length >= 2;

  return (
    <div ref={boxRef} className="relative flex-1 lg:max-w-md">
      {carregando ? (
        <Loader2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden="true" />
      ) : (
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      )}
      <label htmlFor="busca-global" className="sr-only">Buscar projetos, jobs, propostas, mídia, OS e clientes</label>
      <input
        id="busca-global"
        type="search"
        autoComplete="off"
        value={termo}
        onChange={(e) => setTermo(e.target.value)}
        onFocus={() => { if (temResultado) setAberto(true); }}
        onKeyDown={onKey}
        placeholder="Buscar projeto, job, proposta, cliente…"
        role="combobox"
        aria-expanded={mostrarPainel}
        aria-controls="busca-global-lista"
        className="h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      {mostrarPainel && (
        <div
          id="busca-global-lista"
          role="listbox"
          className="absolute left-0 right-0 top-11 z-50 max-h-[28rem] overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          {!temResultado ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {carregando ? "Buscando…" : `Nada encontrado para "${termo.trim()}".`}
            </p>
          ) : (
            grupos.map((g) => (
              <div key={g.modulo} className="mb-1 last:mb-0">
                <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.label}</p>
                {g.itens.map((it) => {
                  const idx = planos.findIndex((p) => p.url === it.url);
                  return (
                    <button
                      key={it.url}
                      type="button"
                      role="option"
                      aria-selected={idx === ativo}
                      onMouseEnter={() => setAtivo(idx)}
                      onClick={() => ir(it.url)}
                      className={cn(
                        "flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left",
                        idx === ativo ? "bg-muted" : "hover:bg-muted/60",
                      )}
                    >
                      <span className="text-sm font-medium leading-tight">{it.titulo}</span>
                      {it.sub && <span className="text-xs text-muted-foreground">{it.sub}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
