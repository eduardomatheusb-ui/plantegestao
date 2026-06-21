"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarOs, type OsFormState } from "@/lib/os/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string; clienteId: string };

export type OsInicial = Partial<Record<
  "titulo" | "clienteId" | "projetoId" | "vencimento" | "formaPagamento" | "condicoesPagamento" | "observacao",
  string
>>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar ordem"}</Button>;
}

export function OsForm({
  id,
  inicial = {},
  clientes,
  projetos,
  cancelHref,
}: {
  id: string | null;
  inicial?: OsInicial;
  clientes: Opt[];
  projetos: ProjetoOpt[];
  cancelHref: string;
}) {
  const action = salvarOs.bind(null, id);
  const [state, formAction] = useActionState<OsFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];
  const [clienteId, setClienteId] = React.useState(inicial.clienteId ?? "");
  const projetosDoCliente = projetos.filter((p) => p.clienteId === clienteId);

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
      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
