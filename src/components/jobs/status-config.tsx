"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarJobStatus, type JobFormState } from "@/lib/jobs/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Salvar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Salvando…" : label}
    </Button>
  );
}

/** Form para criar um novo status. */
export function StatusAddForm() {
  const [state, action] = useActionState<JobFormState, FormData>(
    salvarJobStatus.bind(null, null),
    {},
  );
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="novo-nome">Novo status</Label>
        <Input id="novo-nome" name="nome" placeholder="Ex.: Revisão final" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="novo-cor">Cor</Label>
        <input id="novo-cor" name="cor" type="color" defaultValue="#6366f1" className="h-10 w-16 cursor-pointer rounded-md border border-input bg-background" />
      </div>
      <label className="flex h-10 items-center gap-2 text-sm">
        <input type="checkbox" name="isConcluido" className="size-4 rounded border-input" />
        É &quot;concluído&quot;
      </label>
      <Salvar label="Adicionar" />
      {state.error && <p role="alert" className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

/** Form inline para editar um status existente. */
export function StatusEditForm({
  id,
  nome,
  cor,
  isConcluido,
}: {
  id: string;
  nome: string;
  cor: string | null;
  isConcluido: boolean;
}) {
  const [state, action] = useActionState<JobFormState, FormData>(
    salvarJobStatus.bind(null, id),
    {},
  );
  return (
    <form action={action} className="flex flex-1 flex-wrap items-center gap-3">
      <input
        name="cor"
        type="color"
        defaultValue={cor ?? "#999999"}
        className="h-8 w-10 cursor-pointer rounded border border-input bg-background"
        aria-label="Cor"
      />
      <Input name="nome" defaultValue={nome} className="h-9 max-w-xs flex-1" aria-label="Nome do status" required />
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="isConcluido" defaultChecked={isConcluido} className="size-4 rounded border-input" />
        concluído
      </label>
      <Salvar label="Salvar" />
      {state.error && <p role="alert" className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
