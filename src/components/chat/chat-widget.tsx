"use client";

import * as React from "react";
import Link from "next/link";
import { MessageCircle, X, ArrowLeft, Send, Hash, Loader2, Maximize2 } from "lucide-react";
import { enviarMensagem, buscarMensagens, buscarConversas, buscarChatNaoLidas, marcarCanalLido } from "@/lib/chat/actions";
import type { ConversaView, ChatMensagemView } from "@/lib/chat/queries";
import { iniciais } from "@/lib/format";
import { recarregarSeStale } from "@/lib/stale-action";
import { cn } from "@/lib/utils";

const POLL_BADGE = 45000;
const POLL_MSGS = 5000;

function horario(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export function ChatWidget({ meuId, naoLidasIniciais = 0 }: { meuId: string; naoLidasIniciais?: number }) {
  const [aberto, setAberto] = React.useState(false);
  const [view, setView] = React.useState<"lista" | "conversa">("lista");
  const [naoLidas, setNaoLidas] = React.useState(naoLidasIniciais);
  const [conversas, setConversas] = React.useState<ConversaView[]>([]);
  const [canal, setCanal] = React.useState<string | null>(null);
  const [mensagens, setMensagens] = React.useState<ChatMensagemView[]>([]);
  const [texto, setTexto] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const fimRef = React.useRef<HTMLDivElement>(null);

  const conversaAtual = conversas.find((c) => c.canal === canal);

  // Badge: atualiza enquanto a aba está visível (pausa em segundo plano).
  React.useEffect(() => {
    let vivo = true;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try { const n = await buscarChatNaoLidas(); if (vivo) setNaoLidas(n); }
      catch { /* silencioso */ }
    };
    const t = setInterval(tick, POLL_BADGE);
    return () => { vivo = false; clearInterval(t); };
  }, []);

  const carregarConversas = React.useCallback(async () => {
    try { setConversas(await buscarConversas()); } catch (e) { recarregarSeStale(e); }
  }, []);

  // Ao abrir, carrega conversas.
  React.useEffect(() => {
    if (aberto) void carregarConversas();
  }, [aberto, carregarConversas]);

  // Polling das mensagens enquanto a conversa está aberta.
  React.useEffect(() => {
    if (!aberto || view !== "conversa" || !canal) return;
    let vivo = true;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const novas = await buscarMensagens(canal);
        if (!vivo) return;
        setMensagens((atual) => {
          const mudou = novas.length !== atual.length || novas[novas.length - 1]?.id !== atual[atual.length - 1]?.id;
          if (mudou) { void marcarCanalLido(canal); void buscarChatNaoLidas().then(setNaoLidas).catch(() => {}); return novas; }
          return atual;
        });
      } catch { /* silencioso */ }
    };
    const t = setInterval(tick, POLL_MSGS);
    return () => { vivo = false; clearInterval(t); };
  }, [aberto, view, canal]);

  React.useEffect(() => {
    if (view === "conversa") fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, view]);

  async function abrirConversa(c: ConversaView) {
    setCanal(c.canal);
    setView("conversa");
    setMensagens([]);
    try {
      const msgs = await buscarMensagens(c.canal);
      setMensagens(msgs);
      await marcarCanalLido(c.canal);
      const n = await buscarChatNaoLidas(); setNaoLidas(n);
    } catch (e) { recarregarSeStale(e); }
  }

  function voltar() {
    setView("lista");
    setCanal(null);
    void carregarConversas();
  }

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando || !canal) return;
    setEnviando(true);
    setTexto("");
    const tmp: ChatMensagemView = { id: `tmp-${meuId}-${mensagens.length}`, autorId: meuId, autorNome: "Você", autorAvatar: null, corpo: t, criadoEm: new Date() };
    setMensagens((m) => [...m, tmp]);
    try {
      await enviarMensagem(canal, t);
      setMensagens(await buscarMensagens(canal));
    } catch (e) {
      if (!recarregarSeStale(e)) { setMensagens((m) => m.filter((x) => x.id !== tmp.id)); setTexto(t); }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar chat" : "Abrir chat"}
        className="fixed bottom-5 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-brand-yellow text-ink-900 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:bottom-6 lg:right-6"
      >
        {aberto ? <X className="size-6" aria-hidden="true" /> : <MessageCircle className="size-6" aria-hidden="true" />}
        {!aberto && naoLidas > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-bold leading-5 text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {/* Painel */}
      {aberto && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[70vh] max-h-[560px] w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:w-96 lg:right-6">
          {/* Header */}
          <header className="flex items-center gap-2 border-b border-border bg-chrome px-3 py-2.5 text-chrome-foreground">
            {view === "conversa" ? (
              <>
                <button type="button" onClick={voltar} aria-label="Voltar" className="rounded-md p-1 hover:bg-white-a10">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                </button>
                <span className={cn("flex size-7 items-center justify-center rounded-full text-[11px] font-bold", conversaAtual?.tipo === "geral" ? "bg-brand-yellow text-ink-900" : "bg-white-a10")}>
                  {conversaAtual?.tipo === "geral" ? <Hash className="size-4" aria-hidden="true" /> : iniciais(conversaAtual?.titulo ?? "?")}
                </span>
                <span className="flex-1 truncate text-sm font-semibold">{conversaAtual?.titulo ?? "Conversa"}</span>
              </>
            ) : (
              <>
                <MessageCircle className="size-5 text-brand-yellow" aria-hidden="true" />
                <span className="flex-1 text-sm font-semibold">Chat da equipe</span>
              </>
            )}
            <Link href={canal ? `/chat?c=${encodeURIComponent(canal)}` : "/chat"} aria-label="Abrir tela cheia" className="rounded-md p-1 hover:bg-white-a10" onClick={() => setAberto(false)}>
              <Maximize2 className="size-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={() => setAberto(false)} aria-label="Fechar" className="rounded-md p-1 hover:bg-white-a10">
              <X className="size-4" aria-hidden="true" />
            </button>
          </header>

          {/* Corpo */}
          {view === "lista" ? (
            <div className="flex-1 overflow-y-auto p-2">
              {conversas.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Carregando…</p>
              ) : (
                conversas.map((c) => (
                  <button
                    key={c.canal}
                    type="button"
                    onClick={() => abrirConversa(c)}
                    className="mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-muted"
                  >
                    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", c.tipo === "geral" ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
                      {c.tipo === "geral" ? <Hash className="size-4" aria-hidden="true" /> : iniciais(c.titulo)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-1">
                        <span className="truncate font-medium">{c.titulo}</span>
                        {c.naoLidas > 0 && (
                          <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
                            {c.naoLidas > 9 ? "9+" : c.naoLidas}
                          </span>
                        )}
                      </span>
                      {c.ultimaMsg && <span className="block truncate text-xs text-muted-foreground">{c.ultimaMsg}</span>}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            <>
              <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens da conversa" className="flex-1 space-y-1.5 overflow-y-auto px-3 py-3">
                {mensagens.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">Sem mensagens ainda. Manda a primeira! 👋</p>
                ) : (
                  mensagens.map((m) => {
                    const meu = m.autorId === meuId;
                    return (
                      <div key={m.id} className={cn("flex gap-2", meu && "flex-row-reverse")}>
                        {!meu && (
                          <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold" title={m.autorNome}>
                            {iniciais(m.autorNome)}
                          </span>
                        )}
                        <div className={cn("max-w-[78%] rounded-2xl px-3 py-1.5 text-sm", meu ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
                          {!meu && <span className="mb-0.5 block text-[11px] font-semibold opacity-70">{m.autorNome}</span>}
                          <span className="whitespace-pre-wrap break-words">{m.corpo}</span>
                          <span className={cn("mt-0.5 block text-[10px]", meu ? "text-ink-900/60" : "text-muted-foreground")}>{horario(m.criadoEm)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={fimRef} />
              </div>

              <div className="border-t border-border p-2">
                <div className="flex items-end gap-2">
                  <label htmlFor="chat-widget-msg" className="sr-only">Mensagem</label>
                  <textarea
                    id="chat-widget-msg"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); } }}
                    rows={1}
                    placeholder="Mensagem…"
                    className="max-h-24 min-h-[38px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => void enviar()}
                    disabled={enviando || !texto.trim()}
                    aria-label="Enviar"
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-yellow text-ink-900 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
