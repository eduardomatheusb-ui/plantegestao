"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUp, ArrowDown, Trash2, Save } from "lucide-react";
import * as React from "react";
import { atualizarItem, removerItem, reordenarItem, type ItemState } from "@/lib/propostas/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAction } from "@/components/shared/inline-action";
import { formatBRL } from "@/lib/utils";

/** Lê número no jeito brasileiro para a prévia (o servidor faz o mesmo ao salvar). */
function numBR(v: string): number {
  const s = (v || "").trim();
  if (!s) return 0;
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) ? n : 0;
}

type Item = {
  id: string;
  nome: string;
  descricao: string | null;
  valorUnit: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
  visivel: boolean;
  recorrencia: string;
};

function SalvarLinha() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending} title="Salvar item">
      <Save className="size-4" />
      {pending ? "…" : "Salvar"}
    </Button>
  );
}

const num = "h-9 w-full rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ItemRow({ item, isFirst, isLast }: { item: Item; isFirst: boolean; isLast: boolean }) {
  const [state, action] = useActionState<ItemState, FormData>(atualizarItem.bind(null, item.id), {});
  const [valor, setValor] = React.useState(String(Number(item.valorUnit)));
  const [qtd, setQtd] = React.useState(String(Number(item.quantidade)));
  const [desc, setDesc] = React.useState(String(Number(item.desconto)));
  const [recorrencia, setRecorrencia] = React.useState(item.recorrencia === "MENSAL" ? "MENSAL" : "UNICA");

  // Prévia ao vivo: o subtotal acompanha o que você digita; clicar Salvar grava.
  const subtotal = Math.max(0, numBR(valor) * numBR(qtd) - numBR(desc));
  const mudou = subtotal !== Number(item.subtotal) || recorrencia !== (item.recorrencia === "MENSAL" ? "MENSAL" : "UNICA");
  const sufixo = recorrencia === "MENSAL" ? " /mês" : "";

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <form action={action} className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
          <Input name="nome" defaultValue={item.nome} required aria-label="Item" className="h-9 sm:col-span-4" />
          <Input name="valorUnit" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} aria-label="Valor unitário" className={`${num} sm:col-span-2`} />
          <Input name="quantidade" type="number" step="0.01" min="0" value={qtd} onChange={(e) => setQtd(e.target.value)} aria-label="Quantidade" className={`${num} sm:col-span-2`} />
          <Input name="desconto" type="number" step="0.01" min="0" value={desc} onChange={(e) => setDesc(e.target.value)} aria-label="Desconto" className={`${num} sm:col-span-2`} />
          <span className={`text-right text-sm font-semibold tabular-nums sm:col-span-2 ${mudou ? "text-amber-600 dark:text-amber-400" : ""}`} title={mudou ? "Prévia. Clique em Salvar para gravar." : undefined}>{formatBRL(subtotal)}{sufixo}</span>
        </div>
        <Input name="descricao" defaultValue={item.descricao ?? ""} placeholder="Descrição (aparece no PDF)" aria-label="Descrição" className="h-9" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" name="visivel" defaultChecked={item.visivel} className="size-4 rounded border-input" />
              Visível no PDF
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              Cobrança
              <select name="recorrencia" value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)} className="h-8 rounded-md border border-input bg-background px-1.5 text-xs">
                <option value="UNICA">Única</option>
                <option value="MENSAL">Mensal</option>
              </select>
            </label>
          </div>
          {state.error && <span role="alert" className="text-xs text-destructive">{state.error}</span>}
          <SalvarLinha />
        </div>
      </form>

      <div className="flex items-center justify-end gap-1 border-t border-border pt-2">
        <InlineAction action={reordenarItem.bind(null, item.id, "cima")} title="Subir" className={isFirst ? "pointer-events-none opacity-30" : ""}>
          <ArrowUp className="size-3.5" />
        </InlineAction>
        <InlineAction action={reordenarItem.bind(null, item.id, "baixo")} title="Descer" className={isLast ? "pointer-events-none opacity-30" : ""}>
          <ArrowDown className="size-3.5" />
        </InlineAction>
        <InlineAction action={removerItem.bind(null, item.id)} title="Remover item">
          <Trash2 className="size-3.5" />
        </InlineAction>
      </div>
    </div>
  );
}
