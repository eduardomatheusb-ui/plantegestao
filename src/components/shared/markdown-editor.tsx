"use client";

import * as React from "react";
import { Bold, Italic, Heading, List, ListOrdered, Link2, Eye, Pencil } from "lucide-react";
import { MarkdownView } from "./markdown-view";
import { cn } from "@/lib/utils";

type Acao = "bold" | "italic" | "heading" | "ul" | "ol" | "link";

function ToolbarBtn({ onClick, titulo, children }: { onClick: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-label={titulo}
      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

/**
 * Editor de texto simples baseado em Markdown: barra com formatação básica,
 * textarea (envia via `name`) e prévia. Sem dependência pesada.
 */
export function MarkdownEditor({
  name, defaultValue = "", rows = 8, placeholder, id,
}: {
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  id?: string;
}) {
  const ref = React.useRef<HTMLTextAreaElement>(null);
  const [valor, setValor] = React.useState(defaultValue);
  const [previa, setPrevia] = React.useState(false);

  function aplicar(acao: Acao) {
    const el = ref.current;
    if (!el) return;
    const ini = el.selectionStart;
    const fim = el.selectionEnd;
    const sel = valor.slice(ini, fim);
    const antes = valor.slice(0, ini);
    const depois = valor.slice(fim);
    let novoTexto = sel;
    let selIni = ini;
    let selFim = fim;

    const linhaPrefix = (prefixo: (n: number) => string) => {
      // aplica um prefixo em cada linha selecionada (ou na linha atual)
      const alvo = sel || "";
      const linhas = (alvo || "texto").split("\n");
      novoTexto = linhas.map((l, i) => `${prefixo(i)}${l}`).join("\n");
      selIni = ini;
      selFim = ini + novoTexto.length;
    };

    if (acao === "bold" || acao === "italic") {
      const marca = acao === "bold" ? "**" : "*";
      const conteudo = sel || (acao === "bold" ? "negrito" : "itálico");
      novoTexto = `${marca}${conteudo}${marca}`;
      selIni = ini + marca.length;
      selFim = selIni + conteudo.length;
    } else if (acao === "heading") {
      linhaPrefix(() => "## ");
    } else if (acao === "ul") {
      linhaPrefix(() => "- ");
    } else if (acao === "ol") {
      linhaPrefix((n) => `${n + 1}. `);
    } else if (acao === "link") {
      const rotulo = sel || "texto";
      novoTexto = `[${rotulo}](https://)`;
      selIni = ini + novoTexto.length - 9; // posiciona dentro do (https://)
      selFim = ini + novoTexto.length - 1;
    }

    const atualizado = antes + novoTexto + depois;
    setValor(atualizado);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selIni, selFim);
    });
  }

  return (
    <div className="rounded-md border border-input">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
        <ToolbarBtn onClick={() => aplicar("bold")} titulo="Negrito"><Bold className="size-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => aplicar("italic")} titulo="Itálico"><Italic className="size-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => aplicar("heading")} titulo="Título"><Heading className="size-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => aplicar("ul")} titulo="Lista"><List className="size-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => aplicar("ol")} titulo="Lista numerada"><ListOrdered className="size-4" /></ToolbarBtn>
        <ToolbarBtn onClick={() => aplicar("link")} titulo="Link"><Link2 className="size-4" /></ToolbarBtn>
        <div className="ml-auto">
          <button type="button" onClick={() => setPrevia((v) => !v)} title={previa ? "Editar" : "Prévia"} aria-label={previa ? "Editar" : "Prévia"}
            className={cn("inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium", previa ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted")}>
            {previa ? <><Pencil className="size-3.5" /> Editar</> : <><Eye className="size-3.5" /> Prévia</>}
          </button>
        </div>
      </div>

      {previa ? (
        <div className="min-h-[8rem] p-3">
          {valor.trim() ? <MarkdownView texto={valor} /> : <p className="text-sm text-muted-foreground">Nada para pré-visualizar.</p>}
        </div>
      ) : (
        <textarea
          id={id}
          ref={ref}
          name={name}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="block w-full resize-y bg-background p-3 text-sm focus-visible:outline-none"
        />
      )}
      {/* garante o envio mesmo em modo prévia */}
      {previa && <input type="hidden" name={name} value={valor} />}
    </div>
  );
}
