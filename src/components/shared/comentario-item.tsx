"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { editarComentario, removerComentario } from "@/lib/projetos/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { iniciais } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/** Destaca menções @Nome e transforma links (http/https) em cliques. */
function renderTexto(texto: string) {
  return texto.split(/(https?:\/\/[^\s]+|@[\p{L}]+)/u).map((p, i) => {
    if (/^https?:\/\//.test(p)) {
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-2 hover:opacity-80">{p}</a>
      );
    }
    if (/^@[\p{L}]+$/u.test(p)) {
      return <span key={i} className="rounded bg-brand-yellow/25 px-0.5 font-medium text-foreground">{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

export function ComentarioItem({
  id, autorNome, texto, quando, editado, podeEditar, podeRemover,
}: {
  id: string;
  autorNome: string;
  texto: string;
  quando: string;
  editado: boolean;
  podeEditar: boolean;
  podeRemover: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(texto);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar() {
    setErro(null);
    iniciar(async () => {
      try {
        const r = await editarComentario(id, valor);
        if (r?.error) setErro(r.error);
        else setEditando(false);
      } catch (e) {
        if (!recarregarSeStale(e)) setErro("Não foi possível salvar.");
      }
    });
  }
  function remover() {
    iniciar(async () => { try { await removerComentario(id); } catch (e) { recarregarSeStale(e); } });
  }

  return (
    <li className="flex gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{iniciais(autorNome)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{autorNome}</p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{quando}{editado ? " · editado" : ""}</span>
            {podeEditar && !editando && (
              <button type="button" onClick={() => { setValor(texto); setEditando(true); }} title="Editar" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <Pencil className="size-3.5" />
              </button>
            )}
            {podeRemover && !editando && (
              <button type="button" onClick={remover} disabled={pendente} title="Remover" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {editando ? (
          <div className="mt-1 space-y-2">
            <Textarea value={valor} onChange={(e) => setValor(e.target.value)} rows={3} autoFocus />
            {erro && <p className="text-xs text-destructive">{erro}</p>}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={salvar} disabled={pendente || !valor.trim()}>Salvar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setEditando(false); setErro(null); }}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">{renderTexto(texto)}</p>
        )}
      </div>
    </li>
  );
}
