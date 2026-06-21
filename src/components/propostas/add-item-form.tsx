"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { adicionarItem, type ItemState } from "@/lib/propostas/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Produto = { id: string; nome: string; descricao: string | null; valorUnit: number };

function Add() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" />
      {pending ? "Adicionando…" : "Adicionar item"}
    </Button>
  );
}

const inputCls = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function AddItemForm({ propostaId, produtos }: { propostaId: string; produtos: Produto[] }) {
  const [state, action] = useActionState<ItemState, FormData>(adicionarItem.bind(null, propostaId), {});

  const nomeRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLInputElement>(null);
  const valorRef = React.useRef<HTMLInputElement>(null);

  function prefill(produtoId: string) {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return;
    if (nomeRef.current) nomeRef.current.value = p.nome;
    if (descRef.current) descRef.current.value = p.descricao ?? "";
    if (valorRef.current) valorRef.current.value = String(Number(p.valorUnit));
  }

  return (
    <form action={action} className="space-y-3 rounded-lg border border-dashed border-border p-4">
      <p className="text-sm font-medium">Adicionar item</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="add-produto">Do catálogo (opcional)</Label>
          <select
            id="add-produto"
            name="produtoId"
            className={inputCls}
            defaultValue=""
            onChange={(e) => prefill(e.target.value)}
          >
            <option value="">— item livre —</option>
            {produtos.map((p) => (<option key={p.id} value={p.id}>{p.nome}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-nome">Item</Label>
          <Input id="add-nome" name="nome" ref={nomeRef} required placeholder="Nome do serviço" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="add-desc">Descrição</Label>
        <Input id="add-desc" name="descricao" ref={descRef} placeholder="Detalhe do serviço (aparece no PDF)" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="add-valor">Valor unit. (R$)</Label>
          <Input id="add-valor" name="valorUnit" ref={valorRef} type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-qtd">Qtd.</Label>
          <Input id="add-qtd" name="quantidade" type="number" step="0.01" min="0" defaultValue="1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="add-desc-v">Desconto (R$)</Label>
          <Input id="add-desc-v" name="desconto" type="number" step="0.01" min="0" defaultValue="0" />
        </div>
        <label className="flex items-end gap-2 pb-2.5 text-sm">
          <input type="checkbox" name="visivel" defaultChecked className="size-4 rounded border-input" />
          Visível no PDF
        </label>
      </div>

      {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
      <div className="flex justify-end">
        <Add />
      </div>
    </form>
  );
}
