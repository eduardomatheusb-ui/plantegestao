"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowUp, ArrowDown, Trash2, Save } from "lucide-react";
import { atualizarItem, removerItem, reordenarItem, type ItemState } from "@/lib/propostas/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAction } from "@/components/shared/inline-action";
import { formatBRL } from "@/lib/utils";

type Item = {
  id: string;
  nome: string;
  descricao: string | null;
  valorUnit: number;
  quantidade: number;
  desconto: number;
  subtotal: number;
  visivel: boolean;
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

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <form action={action} className="space-y-2">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12 sm:items-center">
          <Input name="nome" defaultValue={item.nome} required aria-label="Item" className="h-9 sm:col-span-4" />
          <Input name="valorUnit" type="number" step="0.01" min="0" defaultValue={String(Number(item.valorUnit))} aria-label="Valor unitário" className={`${num} sm:col-span-2`} />
          <Input name="quantidade" type="number" step="0.01" min="0" defaultValue={String(Number(item.quantidade))} aria-label="Quantidade" className={`${num} sm:col-span-2`} />
          <Input name="desconto" type="number" step="0.01" min="0" defaultValue={String(Number(item.desconto))} aria-label="Desconto" className={`${num} sm:col-span-2`} />
          <span className="text-right text-sm font-semibold tabular-nums sm:col-span-2">{formatBRL(Number(item.subtotal))}</span>
        </div>
        <Input name="descricao" defaultValue={item.descricao ?? ""} placeholder="Descrição (aparece no PDF)" aria-label="Descrição" className="h-9" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <input type="checkbox" name="visivel" defaultChecked={item.visivel} className="size-4 rounded border-input" />
            Visível no PDF
          </label>
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
