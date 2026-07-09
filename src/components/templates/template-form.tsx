"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarTemplate, type TemplateFormState } from "@/lib/templates/actions";
import { TIPOS_JOB } from "@/lib/jobs/tipos";
import { PRIORIDADES } from "@/lib/jobs/prioridade";
import { TemplateTarefasBuilder, type TarefaLinha } from "./template-tarefas-builder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type TemplateInicial = {
  nome?: string; tipo?: string; prioridade?: string; responsavelId?: string; briefing?: string; tarefas?: TarefaLinha[];
};

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar template"}</Button>;
}

export function TemplateForm({ id, inicial = {}, usuarios, cancelHref }: { id: string | null; inicial?: TemplateInicial; usuarios: Opt[]; cancelHref: string }) {
  const [state, formAction] = useActionState<TemplateFormState, FormData>(salvarTemplate.bind(null, id), {});

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome do template <span className="text-destructive">*</span></Label>
          <Input id="nome" name="nome" defaultValue={inicial.nome ?? ""} required placeholder="Ex.: Reels padrão, Carrossel institucional…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de job</Label>
          <select id="tipo" name="tipo" className={sel} defaultValue={inicial.tipo ?? "post_estatico"}>
            {TIPOS_JOB.map((t) => (<option key={t.key} value={t.key}>{t.label}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <select id="prioridade" name="prioridade" className={sel} defaultValue={inicial.prioridade ?? "normal"}>
            {PRIORIDADES.map((p) => (<option key={p.key} value={p.key}>{p.label}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="responsavelId">Responsável padrão</Label>
          <select id="responsavelId" name="responsavelId" className={sel} defaultValue={inicial.responsavelId ?? ""}>
            <option value="">— (definir na criação)</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="briefing">Briefing padrão</Label>
          <Textarea id="briefing" name="briefing" rows={4} defaultValue={inicial.briefing ?? ""} placeholder="Roteiro/estrutura padrão para este tipo de job…" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Fluxo de tarefas</Label>
          <p className="text-xs text-muted-foreground">Etapas geradas ao usar o template. O prazo (dias) é relativo ao início do job.</p>
          <TemplateTarefasBuilder inicial={inicial.tarefas ?? []} usuarios={usuarios} />
        </div>
      </div>

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /><span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
