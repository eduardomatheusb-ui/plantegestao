"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarProjeto, type ProjetoFormState } from "@/lib/projetos/actions";
import { PROJETO_STATUS } from "@/lib/projetos/situacao";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Option = { id: string; nome: string };

export type ProjetoInicial = {
  nome?: string;
  clienteId?: string;
  responsavelId?: string;
  status?: string;
  prazoDesejado?: string;
  prazoEstimado?: string;
  budget?: string;
  tempoEstimadoHoras?: string;
  briefing?: string;
};

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar projeto"}
    </Button>
  );
}

export function ProjetoForm({
  id,
  inicial = {},
  clientes,
  usuarios,
  projetoPaiId,
  cancelHref,
}: {
  id: string | null;
  inicial?: ProjetoInicial;
  clientes: Option[];
  usuarios: Option[];
  projetoPaiId?: string;
  cancelHref: string;
}) {
  const action = salvarProjeto.bind(null, id);
  const [state, formAction] = useActionState<ProjetoFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {projetoPaiId && <input type="hidden" name="projetoPaiId" value={projetoPaiId} />}

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome do projeto <span className="text-destructive">*</span></Label>
          <Input id="nome" name="nome" defaultValue={inicial.nome ?? ""} aria-invalid={!!err("nome")} required />
          {err("nome") && <p className="text-xs text-destructive">{err("nome")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={selectCls} defaultValue={inicial.clienteId ?? ""} aria-invalid={!!err("clienteId")}>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {err("clienteId") && <p className="text-xs text-destructive">{err("clienteId")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
          <select id="responsavelId" name="responsavelId" className={selectCls} defaultValue={inicial.responsavelId ?? ""}>
            <option value="">— (nenhum)</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={selectCls} defaultValue={inicial.status ?? "SEM_STATUS"}>
            {PROJETO_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazoDesejado">Prazo desejado</Label>
          <Input id="prazoDesejado" name="prazoDesejado" type="date" defaultValue={inicial.prazoDesejado ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazoEstimado">Prazo estimado</Label>
          <Input id="prazoEstimado" name="prazoEstimado" type="date" defaultValue={inicial.prazoEstimado ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget (R$)</Label>
          <Input id="budget" name="budget" type="number" step="0.01" min="0" defaultValue={inicial.budget ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempoEstimadoHoras">Tempo estimado (horas)</Label>
          <Input id="tempoEstimadoHoras" name="tempoEstimadoHoras" type="number" step="0.5" min="0" defaultValue={inicial.tempoEstimadoHoras ?? ""} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="briefing">Briefing</Label>
          <Textarea id="briefing" name="briefing" rows={5} defaultValue={inicial.briefing ?? ""} placeholder="Objetivo, contexto, requisitos…" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
