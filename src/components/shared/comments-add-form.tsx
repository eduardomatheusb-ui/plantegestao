"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Usuario = { id: string; nome: string };

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Enviando…" : "Comentar"}
    </Button>
  );
}

export function CommentsAddForm({
  action,
  usuarios = [],
}: {
  action: (formData: FormData) => Promise<void>;
  usuarios?: Usuario[];
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [texto, setTexto] = React.useState("");
  const [query, setQuery] = React.useState<string | null>(null);
  const [inicio, setInicio] = React.useState(0);
  const [mencionados, setMencionados] = React.useState<Usuario[]>([]);

  function aoDigitar(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const valor = e.target.value;
    setTexto(valor);
    const pos = e.target.selectionStart ?? valor.length;
    const antes = valor.slice(0, pos);
    const m = antes.match(/@([\p{L}]*)$/u);
    if (m) {
      setQuery(m[1].toLowerCase());
      setInicio(pos - m[0].length);
    } else {
      setQuery(null);
    }
  }

  function escolher(u: Usuario) {
    const pos = ref.current?.selectionStart ?? texto.length;
    const novo = `${texto.slice(0, inicio)}@${u.nome} ${texto.slice(pos)}`;
    setTexto(novo);
    setQuery(null);
    setMencionados((m) => (m.some((x) => x.id === u.id) ? m : [...m, u]));
    ref.current?.focus();
  }

  const sugestoes =
    query === null
      ? []
      : usuarios.filter((u) => u.nome.toLowerCase().includes(query)).slice(0, 6);

  return (
    <form action={action} className="space-y-2">
      <label htmlFor="texto" className="sr-only">Novo comentário</label>
      <div className="relative">
        <Textarea
          ref={ref}
          id="texto"
          name="texto"
          value={texto}
          onChange={aoDigitar}
          onBlur={() => setTimeout(() => setQuery(null), 150)}
          placeholder="Escreva um comentário… use @ para marcar alguém"
          required
        />
        {sugestoes.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-border bg-popover shadow-md">
            {sugestoes.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); escolher(u); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                    {u.nome.slice(0, 2).toUpperCase()}
                  </span>
                  {u.nome}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input type="hidden" name="mencoes" value={mencionados.map((m) => m.id).join(",")} />
      {mencionados.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Marcando: {mencionados.map((m) => `@${m.nome}`).join(", ")}
        </p>
      )}
      <div className="flex justify-end">
        <Enviar />
      </div>
    </form>
  );
}
