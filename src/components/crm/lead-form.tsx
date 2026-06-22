"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarLead, type LeadFormState } from "@/lib/crm/actions";
import { ETAPAS_LEAD } from "@/lib/crm/etapas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type LeadInicial = Partial<{
  nome: string; empresa: string; origem: string; email: string; telefone: string;
  valorEstimado: number | null; etapa: string; responsavelId: string; observacao: string; motivoPerda: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar lead"}</Button>;
}

export function LeadForm({ id, inicial = {}, usuarios, cancelHref }: { id: string | null; inicial?: LeadInicial; usuarios: Opt[]; cancelHref: string }) {
  const [state, action] = useActionState<LeadFormState, FormData>(salvarLead.bind(null, id), {});
  const [etapa, setEtapa] = React.useState(inicial.etapa ?? "novo");

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="nome">Contato <span className="text-destructive">*</span></Label>
          <Input id="nome" name="nome" defaultValue={inicial.nome ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="empresa">Empresa</Label>
          <Input id="empresa" name="empresa" defaultValue={inicial.empresa ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={inicial.email ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" type="tel" defaultValue={inicial.telefone ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="origem">Origem</Label>
          <Input id="origem" name="origem" defaultValue={inicial.origem ?? ""} placeholder="Indicação, Instagram, site…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valorEstimado">Valor estimado (R$)</Label>
          <Input id="valorEstimado" name="valorEstimado" type="number" step="0.01" defaultValue={inicial.valorEstimado ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="etapa">Etapa</Label>
          <select id="etapa" name="etapa" className={sel} value={etapa} onChange={(e) => setEtapa(e.target.value)}>
            {ETAPAS_LEAD.map((e) => (<option key={e.key} value={e.key}>{e.label}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
          <select id="responsavelId" name="responsavelId" className={sel} defaultValue={inicial.responsavelId ?? ""}>
            <option value="">—</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacao">Observação</Label>
          <Textarea id="observacao" name="observacao" rows={3} defaultValue={inicial.observacao ?? ""} />
        </div>
        {etapa === "perdido" && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="motivoPerda">Motivo da perda</Label>
            <Input id="motivoPerda" name="motivoPerda" defaultValue={inicial.motivoPerda ?? ""} placeholder="Preço, prazo, concorrente…" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
