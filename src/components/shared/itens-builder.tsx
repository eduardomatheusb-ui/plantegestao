"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

type Linha = { descricao: string; quantidade: string; valorUnit: string; desconto: string };

/**
 * Construtor de itens para formulários de criação (OS, Produção, Propostas).
 * Adiciona/remove linhas um a um e envia tudo num input escondido `name` como JSON:
 * `[{ descricao, quantidade, valorUnit, desconto }]`. A action processa esse JSON.
 */
export function ItensBuilder({
  name = "itens",
  label = "Itens",
  descricaoLabel = "Item",
  descricaoPlaceholder = "Item / descrição",
  comDesconto = false,
}: {
  name?: string;
  label?: string;
  descricaoLabel?: string;
  descricaoPlaceholder?: string;
  comDesconto?: boolean;
}) {
  const [itens, setItens] = React.useState<Linha[]>([]);
  const sub = (it: Linha) =>
    (Number(it.quantidade) || 0) * (Number(it.valorUnit) || 0) - (comDesconto ? Number(it.desconto) || 0 : 0);
  const total = itens.reduce((s, it) => s + sub(it), 0);
  const setItem = (i: number, campo: keyof Linha, v: string) =>
    setItens((arr) => arr.map((x, j) => (j === i ? { ...x, [campo]: v } : x)));

  const json = JSON.stringify(
    itens
      .filter((it) => it.descricao.trim())
      .map((it) => ({
        descricao: it.descricao,
        quantidade: Number(it.quantidade) || 0,
        valorUnit: Number(it.valorUnit) || 0,
        desconto: comDesconto ? Number(it.desconto) || 0 : 0,
      })),
  );

  const descCols = comDesconto ? "sm:col-span-4" : "sm:col-span-6";

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-sm text-muted-foreground">Total: <strong className="tabular-nums text-foreground">{formatBRL(total)}</strong></span>
      </div>

      {itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item. Adicione um a um abaixo.</p>}

      {itens.map((it, i) => (
        <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
          <Input value={it.descricao} onChange={(e) => setItem(i, "descricao", e.target.value)} placeholder={descricaoPlaceholder} aria-label={descricaoLabel} className={`h-9 ${descCols}`} />
          <Input value={it.quantidade} onChange={(e) => setItem(i, "quantidade", e.target.value)} type="number" min="0" step="0.01" aria-label="Quantidade" className="h-9 text-right tabular-nums sm:col-span-2" />
          <Input value={it.valorUnit} onChange={(e) => setItem(i, "valorUnit", e.target.value)} type="number" min="0" step="0.01" aria-label="Valor unitário" className="h-9 text-right tabular-nums sm:col-span-2" />
          {comDesconto && (
            <Input value={it.desconto} onChange={(e) => setItem(i, "desconto", e.target.value)} type="number" min="0" step="0.01" aria-label="Desconto" className="h-9 text-right tabular-nums sm:col-span-2" />
          )}
          <span className="text-right text-sm font-medium tabular-nums sm:col-span-1">{formatBRL(sub(it))}</span>
          <div className="flex justify-end sm:col-span-1">
            <button type="button" onClick={() => setItens((arr) => arr.filter((_, j) => j !== i))} aria-label="Remover item" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={() => setItens((arr) => [...arr, { descricao: "", quantidade: "1", valorUnit: "0", desconto: "0" }])}>
        <Plus className="size-4" /> Adicionar item
      </Button>
      <input type="hidden" name={name} value={json} />
    </div>
  );
}
