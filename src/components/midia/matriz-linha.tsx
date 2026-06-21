"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { setInsercao, removerLinha } from "@/lib/midia/actions";
import { InlineAction } from "@/components/shared/inline-action";
import { formatBRL } from "@/lib/utils";

type Linha = {
  id: string;
  pecaCodigo: string | null;
  pecaNome: string | null;
  programaNome: string | null;
  formato: string | null;
  valorInsercao: number;
};

/** Uma linha da grade: peça × programa × formato + inserções dia a dia. */
export function MatrizLinha({
  linha,
  dias,
  insercoes,
}: {
  linha: Linha;
  dias: number;
  insercoes: Record<number, number>;
}) {
  const [qtys, setQtys] = React.useState<Record<number, number>>(insercoes);
  const [, startTransition] = React.useTransition();

  const total = Object.values(qtys).reduce((a, q) => a + (q || 0), 0);

  function alterar(dia: number, valor: string) {
    const q = Math.max(0, Math.round(Number(valor) || 0));
    setQtys((prev) => ({ ...prev, [dia]: q }));
  }
  function persistir(dia: number) {
    const q = qtys[dia] ?? 0;
    startTransition(() => void setInsercao(linha.id, dia, q));
  }

  return (
    <tr className="border-b border-border">
      <td className="sticky left-0 z-10 min-w-40 border-r border-border bg-card p-2 align-top">
        <p className="text-sm font-medium">
          {linha.pecaCodigo && <span className="text-brand-yellow">{linha.pecaCodigo} · </span>}
          {linha.programaNome ?? linha.pecaNome ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {linha.formato ?? "—"} · {formatBRL(linha.valorInsercao)}/insrç
        </p>
      </td>

      {Array.from({ length: dias }, (_, i) => i + 1).map((dia) => (
        <td key={dia} className="border-r border-border/50 p-0.5">
          <input
            type="number"
            min={0}
            aria-label={`Dia ${dia}`}
            value={qtys[dia] ?? ""}
            onChange={(e) => alterar(dia, e.target.value)}
            onBlur={() => persistir(dia)}
            className="h-8 w-9 rounded border border-transparent bg-transparent text-center text-xs tabular-nums hover:border-border focus-visible:border-ring focus-visible:outline-none"
          />
        </td>
      ))}

      <td className="bg-muted/40 px-2 text-center text-sm font-semibold tabular-nums">{total}</td>
      <td className="px-1">
        <InlineAction action={removerLinha.bind(null, linha.id)} title="Remover linha">
          <Trash2 className="size-3.5" />
        </InlineAction>
      </td>
    </tr>
  );
}
