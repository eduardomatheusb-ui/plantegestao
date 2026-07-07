"use client";

import * as React from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, Link2,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Btn({ onClick, titulo, children }: { onClick: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick} title={titulo} aria-label={titulo}
      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </button>
  );
}

/**
 * Editor de texto simples (rich-text) baseado em contentEditable.
 * Salva HTML no input escondido `name`. Suporta negrito, itálico, sublinhado,
 * listas, link e alinhamento (esquerda/centro/direita/justificado).
 * O HTML é sanitizado na exibição (RichTextView) — só passam tags seguras e text-align.
 */
export function RichTextEditor({
  name, defaultValue = "", placeholder, id, minHeight = "10rem",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  id?: string;
  minHeight?: string;
}) {
  const editRef = React.useRef<HTMLDivElement>(null);
  const hiddenRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (editRef.current) editRef.current.innerHTML = defaultValue || "";
    if (hiddenRef.current) hiddenRef.current.value = defaultValue || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    if (hiddenRef.current && editRef.current) hiddenRef.current.value = editRef.current.innerHTML;
  }

  function cmd(comando: string, valor?: string) {
    editRef.current?.focus();
    document.execCommand(comando, false, valor);
    sync();
  }

  function inserirLink() {
    const url = window.prompt("Endereço do link (https://):", "https://");
    if (url) cmd("createLink", url);
  }

  return (
    <div className="rounded-md border border-input focus-within:ring-2 focus-within:ring-ring">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
        <Btn onClick={() => cmd("bold")} titulo="Negrito"><Bold className="size-4" /></Btn>
        <Btn onClick={() => cmd("italic")} titulo="Itálico"><Italic className="size-4" /></Btn>
        <Btn onClick={() => cmd("underline")} titulo="Sublinhado"><Underline className="size-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <Btn onClick={() => cmd("insertUnorderedList")} titulo="Lista"><List className="size-4" /></Btn>
        <Btn onClick={() => cmd("insertOrderedList")} titulo="Lista numerada"><ListOrdered className="size-4" /></Btn>
        <Btn onClick={inserirLink} titulo="Link"><Link2 className="size-4" /></Btn>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <Btn onClick={() => cmd("justifyLeft")} titulo="Alinhar à esquerda"><AlignLeft className="size-4" /></Btn>
        <Btn onClick={() => cmd("justifyCenter")} titulo="Centralizar"><AlignCenter className="size-4" /></Btn>
        <Btn onClick={() => cmd("justifyRight")} titulo="Alinhar à direita"><AlignRight className="size-4" /></Btn>
        <Btn onClick={() => cmd("justifyFull")} titulo="Justificar"><AlignJustify className="size-4" /></Btn>
      </div>

      <div
        id={id}
        ref={editRef}
        contentEditable
        suppressContentEditableWarning
        onInput={sync}
        onBlur={sync}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className={cn(
          "w-full overflow-auto p-3 text-sm leading-relaxed focus:outline-none",
          "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
          "empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
        )}
      />
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={defaultValue} />
    </div>
  );
}
