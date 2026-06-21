"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Trash2, Save } from "lucide-react";
import { atualizarLinha, removerLinha } from "@/lib/midia/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineAction } from "@/components/shared/inline-action";
import { subtotalLinha } from "@/lib/midia/calculo";
import { formatBRL } from "@/lib/utils";

type Linha = {
  id: string;
  pecaCodigo: string | null;
  produto: string | null;
  local: string | null;
  periodoInicio: string | null; // YYYY-MM-DD
  periodoFim: string | null;
  quantidade: number;
  valorInsercao: number;
  desconto: number;
};

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending} title="Salvar linha">
      <Save className="size-4" />
      {pending ? "…" : "Salvar"}
    </Button>
  );
}

const num = "h-9 w-full rounded-md border border-input bg-background px-2 text-right text-sm tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Linha de grade no modo PERÍODO (mídia externa): produto, local, datas, qtd, valor, desconto. */
export function LinhaPeriodo({ linha }: { linha: Linha }) {
  const [state, action] = useActionState<{ error?: string }, FormData>(atualizarLinha.bind(null, linha.id), {});
  const subtotal = subtotalLinha(linha.quantidade, linha.valorInsercao, linha.desconto);

  return (
    <div className="space-y-2 rounded-lg border border-border p-3">
      <p className="text-sm font-medium">
        {linha.pecaCodigo && <span className="text-brand-yellow">{linha.pecaCodigo} · </span>}
        Subtotal atual: <span className="tabular-nums">{formatBRL(subtotal)}</span>
      </p>
      <form action={action} className="grid grid-cols-2 gap-2 sm:grid-cols-12">
        <Input name="produto" defaultValue={linha.produto ?? ""} placeholder="Produto" aria-label="Produto" className="h-9 sm:col-span-3" />
        <Input name="local" defaultValue={linha.local ?? ""} placeholder="Local (linha/ponto)" aria-label="Local" className="h-9 sm:col-span-4" />
        <Input name="periodoInicio" type="date" defaultValue={linha.periodoInicio ?? ""} aria-label="Início" className="h-9 sm:col-span-2" />
        <Input name="periodoFim" type="date" defaultValue={linha.periodoFim ?? ""} aria-label="Fim" className="h-9 sm:col-span-3" />
        <Input name="quantidade" type="number" min="0" step="1" defaultValue={String(linha.quantidade)} aria-label="Total inserções" className={`${num} sm:col-span-2`} />
        <Input name="valorInsercao" type="number" min="0" step="0.01" defaultValue={String(linha.valorInsercao)} aria-label="Valor unitário" className={`${num} sm:col-span-3`} />
        <Input name="desconto" type="number" min="0" step="0.01" defaultValue={String(linha.desconto)} aria-label="Desconto" className={`${num} sm:col-span-2`} />
        <div className="flex items-center gap-2 sm:col-span-5">
          {state.error && <span role="alert" className="text-xs text-destructive">{state.error}</span>}
          <Salvar />
          <InlineAction action={removerLinha.bind(null, linha.id)} title="Remover linha">
            <Trash2 className="size-4" />
          </InlineAction>
        </div>
      </form>
    </div>
  );
}
