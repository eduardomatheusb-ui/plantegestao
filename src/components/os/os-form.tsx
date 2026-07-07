"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import { salvarOs, type OsFormState } from "@/lib/os/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string; clienteId: string };

export type OsInicial = Partial<Record<
  "titulo" | "clienteId" | "fornecedorId" | "projetoId" | "vencimento" | "formaPagamento" | "condicoesPagamento" | "observacao",
  string
>>;

type ItemLinha = { descricao: string; quantidade: string; valorUnit: string };

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar ordem"}</Button>;
}

export function OsForm({
  id,
  inicial = {},
  clientes,
  fornecedores,
  projetos,
  cancelHref,
}: {
  id: string | null;
  inicial?: OsInicial;
  clientes: Opt[];
  fornecedores: Opt[];
  projetos: ProjetoOpt[];
  cancelHref: string;
}) {
  const action = salvarOs.bind(null, id);
  const [state, formAction] = useActionState<OsFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];
  const [clienteId, setClienteId] = React.useState(inicial.clienteId ?? "");
  const projetosDoCliente = projetos.filter((p) => p.clienteId === clienteId);

  // Itens montados um a um (só na criação; na edição, os itens ficam na tela da OS).
  const [itens, setItens] = React.useState<ItemLinha[]>([]);
  const total = itens.reduce((s, it) => s + (Number(it.quantidade) || 0) * (Number(it.valorUnit) || 0), 0);
  const setItem = (i: number, campo: keyof ItemLinha, v: string) =>
    setItens((arr) => arr.map((x, j) => (j === i ? { ...x, [campo]: v } : x)));

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{state.error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título / descrição do serviço <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} placeholder="Ex.: Impressão de 500 folders A5" aria-invalid={!!err("titulo")} required />
          {err("titulo") && <p className="text-xs text-destructive">{err("titulo")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={sel} value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-invalid={!!err("clienteId")}>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {err("clienteId") && <p className="text-xs text-destructive">{err("clienteId")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fornecedorId">Fornecedor / prestador</Label>
          <select id="fornecedorId" name="fornecedorId" className={sel} defaultValue={inicial.fornecedorId ?? ""}>
            <option value="">— (nenhum)</option>
            {fornecedores.map((f) => (<option key={f.id} value={f.id}>{f.nome}</option>))}
          </select>
          <p className="text-xs text-muted-foreground">Quem executa o serviço (gráfica, prestador…).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projetoId">Projeto</Label>
          <select id="projetoId" name="projetoId" className={sel} defaultValue={inicial.projetoId ?? ""} disabled={!clienteId}>
            <option value="">{clienteId ? "— (sem projeto)" : "Escolha o cliente primeiro"}</option>
            {projetosDoCliente.map((p) => (<option key={p.id} value={p.id}>#{p.numero} {p.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="vencimento">Vencimento</Label>
          <Input id="vencimento" name="vencimento" type="date" defaultValue={inicial.vencimento ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="formaPagamento">Forma de pagamento</Label>
          <Input id="formaPagamento" name="formaPagamento" defaultValue={inicial.formaPagamento ?? "Transferência"} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="condicoesPagamento">Condições de pagamento</Label>
          <Input id="condicoesPagamento" name="condicoesPagamento" defaultValue={inicial.condicoesPagamento ?? ""} placeholder="Ex.: 50% na aprovação, 50% na entrega" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacao">Observação</Label>
          <Textarea id="observacao" name="observacao" rows={2} defaultValue={inicial.observacao ?? ""} />
        </div>
      </div>

      {/* Itens — na criação, monta um a um. Na edição, os itens ficam na tela da OS. */}
      {!id ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <div className="flex items-center justify-between">
            <Label>Itens do serviço</Label>
            <span className="text-sm text-muted-foreground">Total: <strong className="tabular-nums text-foreground">{formatBRL(total)}</strong></span>
          </div>

          {itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item. Adicione um a um abaixo.</p>}

          {itens.map((it, i) => (
            <div key={i} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-12">
              <Input value={it.descricao} onChange={(e) => setItem(i, "descricao", e.target.value)} placeholder="Item / descrição" aria-label="Item" className="h-9 sm:col-span-6" />
              <Input value={it.quantidade} onChange={(e) => setItem(i, "quantidade", e.target.value)} type="number" min="0" step="0.01" aria-label="Quantidade" className="h-9 text-right tabular-nums sm:col-span-2" />
              <Input value={it.valorUnit} onChange={(e) => setItem(i, "valorUnit", e.target.value)} type="number" min="0" step="0.01" aria-label="Valor unitário" className="h-9 text-right tabular-nums sm:col-span-2" />
              <span className="text-right text-sm font-medium tabular-nums sm:col-span-1">{formatBRL((Number(it.quantidade) || 0) * (Number(it.valorUnit) || 0))}</span>
              <div className="flex justify-end sm:col-span-1">
                <button type="button" onClick={() => setItens((arr) => arr.filter((_, j) => j !== i))} aria-label="Remover item" className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          ))}

          <Button type="button" variant="outline" size="sm" onClick={() => setItens((arr) => [...arr, { descricao: "", quantidade: "1", valorUnit: "0" }])}>
            <Plus className="size-4" /> Adicionar item
          </Button>
          <input type="hidden" name="itens" value={JSON.stringify(itens.filter((it) => it.descricao.trim()).map((it) => ({ descricao: it.descricao, quantidade: Number(it.quantidade) || 0, valorUnit: Number(it.valorUnit) || 0 })))} />
        </div>
      ) : (
        <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">Os itens desta ordem são editados na tela da ordem de serviço (adicionar, alterar e remover um a um).</p>
      )}

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
