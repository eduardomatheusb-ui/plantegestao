"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Save, Trash2 } from "lucide-react";
import { adicionarItemProducao, atualizarItemProducao, removerItemProducao, type ItemState } from "@/lib/producao/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAction } from "@/components/shared/inline-action";
import { formatBRL } from "@/lib/utils";

const num = "h-9 w-full rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Btn({ label }: { label: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" variant="outline" disabled={pending}>{pending ? "…" : label}</Button>;
}

export function ProducaoItemRow({ item }: { item: { id: string; titulo: string; quantidade: number; valorUnit: number; valorTotal: number } }) {
  const [state, action] = useActionState<ItemState, FormData>(atualizarItemProducao.bind(null, item.id), {});
  return (
    <div className="rounded-lg border border-border p-3">
      <form action={action} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
        <Input name="titulo" defaultValue={item.titulo} required aria-label="Item" className="h-9 sm:col-span-5" />
        <Input name="quantidade" type="number" min="0" step="0.01" defaultValue={String(item.quantidade)} aria-label="Quantidade" className={`${num} sm:col-span-2`} />
        <Input name="valorUnit" type="number" min="0" step="0.01" defaultValue={String(item.valorUnit)} aria-label="Valor unitário" className={`${num} sm:col-span-2`} />
        <span className="text-right text-sm font-semibold tabular-nums sm:col-span-2">{formatBRL(item.valorTotal)}</span>
        <div className="flex items-center justify-end gap-1 sm:col-span-1">
          <Btn label={<Save className="size-4" />} />
        </div>
        {state.error && <span role="alert" className="text-xs text-destructive sm:col-span-12">{state.error}</span>}
      </form>
      <div className="mt-1 flex justify-end">
        <InlineAction action={removerItemProducao.bind(null, item.id)} title="Remover item"><Trash2 className="size-3.5" /></InlineAction>
      </div>
    </div>
  );
}

export function ProducaoAddItem({ ordemId }: { ordemId: string }) {
  const [state, action] = useActionState<ItemState, FormData>(adicionarItemProducao.bind(null, ordemId), {});
  return (
    <form action={action} className="grid grid-cols-2 items-end gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-12">
      <div className="space-y-1 sm:col-span-5">
        <label htmlFor="p-item" className="text-xs text-muted-foreground">Item</label>
        <Input id="p-item" name="titulo" placeholder="Ex.: Cartaz de backbus" required className="h-9" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <label htmlFor="p-qtd" className="text-xs text-muted-foreground">Qtd.</label>
        <Input id="p-qtd" name="quantidade" type="number" min="0" step="0.01" defaultValue="1" className="h-9 text-right" />
      </div>
      <div className="space-y-1 sm:col-span-3">
        <label htmlFor="p-valor" className="text-xs text-muted-foreground">Valor unit. (R$)</label>
        <Input id="p-valor" name="valorUnit" type="number" min="0" step="0.01" defaultValue="0" className="h-9 text-right" />
      </div>
      <div className="sm:col-span-2">
        <Btn label={<><Plus className="size-4" />Adicionar</>} />
      </div>
      {state.error && <span role="alert" className="text-xs text-destructive sm:col-span-12">{state.error}</span>}
    </form>
  );
}
