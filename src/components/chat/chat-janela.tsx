"use client";

import * as React from "react";
import Link from "next/link";
import { Send, Hash, Loader2, Pencil, Trash2, Check, X } from "lucide-react";
import { enviarMensagem, buscarMensagens, marcarCanalLido, editarMensagem, excluirMensagem } from "@/lib/chat/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/utils";
import { linkificar } from "@/components/shared/linkificar";
import type { ConversaView, ChatMensagemView } from "@/lib/chat/queries";

const INTERVALO = 4000;

function horario(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}
function diaRotulo(d: Date): string {
  const data = new Date(d);
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (sameDay(data, hoje)) return "Hoje";
  if (sameDay(data, ontem)) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(data);
}

export function ChatJanela({
  conversas,
  canalAtual,
  mensagensIniciais,
  meuId,
}: {
  conversas: ConversaView[];
  canalAtual: string;
  mensagensIniciais: ChatMensagemView[];
  meuId: string;
}) {
  const [mensagens, setMensagens] = React.useState(mensagensIniciais);
  const [texto, setTexto] = React.useState("");
  const [enviando, setEnviando] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<string | null>(null);
  const [editTexto, setEditTexto] = React.useState("");
  const [confirmarId, setConfirmarId] = React.useState<string | null>(null);
  const fimRef = React.useRef<HTMLDivElement>(null);
  const conversaAtual = conversas.find((c) => c.canal === canalAtual);

  // Sempre que troca de canal (nova prop do servidor), reinicia a lista.
  React.useEffect(() => {
    setMensagens(mensagensIniciais);
  }, [mensagensIniciais, canalAtual]);

  // Marca como lido ao abrir o canal.
  React.useEffect(() => {
    void marcarCanalLido(canalAtual);
  }, [canalAtual]);

  // Polling das mensagens do canal aberto.
  React.useEffect(() => {
    let vivo = true;
    const tick = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const novas = await buscarMensagens(canalAtual);
        if (!vivo) return;
        setMensagens((atual) => {
          if (novas.length !== atual.length || novas[novas.length - 1]?.id !== atual[atual.length - 1]?.id) {
            void marcarCanalLido(canalAtual);
            return novas;
          }
          return atual;
        });
      } catch { /* silencioso */ }
    };
    const t = setInterval(tick, INTERVALO);
    return () => { vivo = false; clearInterval(t); };
  }, [canalAtual]);

  // Auto-scroll ao chegar mensagem.
  React.useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    setTexto("");
    // Otimista
    const tmp: ChatMensagemView = { id: `tmp-${Date.now()}`, autorId: meuId, autorNome: "Você", autorAvatar: null, corpo: t, criadoEm: new Date(), editadoEm: null };
    setMensagens((m) => [...m, tmp]);
    try {
      await enviarMensagem(canalAtual, t);
      const novas = await buscarMensagens(canalAtual);
      setMensagens(novas);
    } catch {
      setMensagens((m) => m.filter((x) => x.id !== tmp.id));
      setTexto(t);
    } finally {
      setEnviando(false);
    }
  }

  function abrirEdicao(m: ChatMensagemView) {
    setEditandoId(m.id);
    setEditTexto(m.corpo);
  }

  async function salvarEdicao(id: string) {
    const t = editTexto.trim();
    if (!t) return;
    const antes = mensagens;
    setMensagens((m) => m.map((x) => (x.id === id ? { ...x, corpo: t, editadoEm: new Date() } : x)));
    setEditandoId(null);
    try {
      await editarMensagem(id, t);
    } catch (e) {
      if (!recarregarSeStale(e)) setMensagens(antes);
    }
  }

  async function excluir(id: string) {
    setConfirmarId(null);
    const antes = mensagens;
    setMensagens((m) => m.filter((x) => x.id !== id));
    try {
      await excluirMensagem(id);
    } catch (e) {
      if (!recarregarSeStale(e)) setMensagens(antes);
    }
  }

  // Agrupa por dia para o separador.
  let ultimoDia = "";

  return (
    <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-lg border border-border bg-card">
      {/* Lista de conversas */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border sm:flex">
        <div className="overflow-y-auto p-2">
          {conversas.map((c) => {
            const ativo = c.canal === canalAtual;
            return (
              <Link
                key={c.canal}
                href={`/chat?c=${encodeURIComponent(c.canal)}`}
                className={cn(
                  "mb-0.5 flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                  ativo ? "bg-muted font-medium" : "hover:bg-muted/60",
                )}
              >
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", c.tipo === "geral" ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
                  {c.tipo === "geral" ? <Hash className="size-4" aria-hidden="true" /> : iniciais(c.titulo)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-1">
                    <span className="truncate">{c.titulo}</span>
                    {c.naoLidas > 0 && (
                      <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
                        {c.naoLidas > 9 ? "9+" : c.naoLidas}
                      </span>
                    )}
                  </span>
                  {c.ultimaMsg && <span className="block truncate text-xs text-muted-foreground">{c.ultimaMsg}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Painel da conversa */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className={cn("flex size-7 items-center justify-center rounded-full text-xs font-bold", conversaAtual?.tipo === "geral" ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
            {conversaAtual?.tipo === "geral" ? <Hash className="size-4" aria-hidden="true" /> : iniciais(conversaAtual?.titulo ?? "?")}
          </span>
          <span className="text-sm font-semibold">{conversaAtual?.titulo ?? "Conversa"}</span>
          {conversaAtual?.tipo === "geral" && <span className="text-xs text-muted-foreground">· toda a equipe</span>}
        </header>

        <div role="log" aria-live="polite" aria-relevant="additions" aria-label="Mensagens da conversa" className="flex-1 space-y-1 overflow-y-auto px-4 py-3">
          {mensagens.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sem mensagens ainda. Manda a primeira! 👋
            </p>
          ) : (
            mensagens.map((m) => {
              const meu = m.autorId === meuId;
              const dia = diaRotulo(m.criadoEm);
              const mostrarDia = dia !== ultimoDia;
              ultimoDia = dia;
              return (
                <React.Fragment key={m.id}>
                  {mostrarDia && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">{dia}</span>
                    </div>
                  )}
                  <div className={cn("group flex items-end gap-2", meu && "flex-row-reverse")}>
                    {!meu && (
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold" title={m.autorNome}>
                        {iniciais(m.autorNome)}
                      </span>
                    )}
                    <div className={cn("max-w-[75%] rounded-2xl px-3 py-1.5 text-sm", meu ? "bg-brand-yellow text-ink-900" : "bg-muted")}>
                      {!meu && <span className="mb-0.5 block text-[11px] font-semibold opacity-70">{m.autorNome}</span>}
                      {editandoId === m.id ? (
                        <div className="flex flex-col gap-1">
                          <textarea
                            value={editTexto}
                            onChange={(e) => setEditTexto(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void salvarEdicao(m.id); }
                              if (e.key === "Escape") setEditandoId(null);
                            }}
                            rows={2}
                            autoFocus
                            className="w-56 max-w-full resize-none rounded-md border border-ink-900/20 bg-white/70 px-2 py-1 text-sm text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900/30"
                          />
                          <div className="flex justify-end gap-1">
                            <button type="button" onClick={() => setEditandoId(null)} aria-label="Cancelar edição" className="rounded p-1 text-ink-900/60 hover:bg-ink-900/10"><X className="size-3.5" /></button>
                            <button type="button" onClick={() => void salvarEdicao(m.id)} disabled={!editTexto.trim()} aria-label="Salvar edição" className="rounded p-1 text-ink-900/80 hover:bg-ink-900/10 disabled:opacity-40"><Check className="size-3.5" /></button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="whitespace-pre-wrap break-words">{linkificar(m.corpo)}</span>
                          <span className={cn("mt-0.5 block text-[10px]", meu ? "text-ink-900/60" : "text-muted-foreground")}>
                            {horario(m.criadoEm)}{m.editadoEm ? " · editado" : ""}
                          </span>
                        </>
                      )}
                    </div>
                    {meu && editandoId !== m.id && !m.id.startsWith("tmp-") && (
                      confirmarId === m.id ? (
                        <div className="flex shrink-0 items-center gap-1 self-center rounded-md bg-muted px-1.5 py-1 text-xs">
                          <span className="text-muted-foreground">Excluir?</span>
                          <button type="button" onClick={() => void excluir(m.id)} className="rounded px-1 font-medium text-destructive hover:bg-destructive/10">Sim</button>
                          <button type="button" onClick={() => setConfirmarId(null)} className="rounded px-1 text-muted-foreground hover:bg-background">Não</button>
                        </div>
                      ) : (
                        <div className="flex shrink-0 gap-0.5 self-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                          <button type="button" onClick={() => abrirEdicao(m)} aria-label="Editar mensagem" title="Editar" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="size-3.5" /></button>
                          <button type="button" onClick={() => setConfirmarId(m.id)} aria-label="Excluir mensagem" title="Excluir" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"><Trash2 className="size-3.5" /></button>
                        </div>
                      )
                    )}
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={fimRef} />
        </div>

        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2">
            <label htmlFor="chat-msg" className="sr-only">Mensagem</label>
            <textarea
              id="chat-msg"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void enviar(); }
              }}
              rows={1}
              placeholder={`Mensagem ${conversaAtual?.tipo === "geral" ? "no Geral" : `para ${conversaAtual?.titulo ?? ""}`}…`}
              className="max-h-32 min-h-[40px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={enviando || !texto.trim()}
              aria-label="Enviar mensagem"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-brand-yellow text-ink-900 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {enviando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </div>
          <p className="mt-1 px-1 text-[11px] text-muted-foreground">Enter envia · Shift+Enter quebra linha</p>
        </div>
      </div>
    </div>
  );
}
