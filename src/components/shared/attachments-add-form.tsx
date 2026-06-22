"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Link2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type State = { error?: string };
type Acao = (prev: State, formData: FormData) => Promise<State>;

function Enviar({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function AttachmentsAddForm({ action, fileAction }: { action: Acao; fileAction: Acao }) {
  const [state, formAction] = useActionState<State, FormData>(action, {});
  const [fileState, fileFormAction] = useActionState<State, FormData>(fileAction, {});

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      {/* Upload de arquivo */}
      <form action={fileFormAction} className="space-y-2">
        <Label htmlFor="anexo-arquivo" className="flex items-center gap-1.5 text-sm">
          <Upload className="size-4" aria-hidden="true" /> Enviar arquivo{" "}
          <span className="text-xs font-normal text-muted-foreground">(até 4 MB)</span>
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <Input id="anexo-arquivo" name="arquivo" type="file" className="flex-1 text-sm file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1" required />
          <Enviar label="Enviar" pendingLabel="Enviando…" />
        </div>
        {fileState.error && <p role="alert" className="text-xs text-destructive">{fileState.error}</p>}
      </form>

      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> ou link <span className="h-px flex-1 bg-border" />
      </div>

      {/* Link externo */}
      <form action={formAction} className="space-y-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="anexo-nome" className="flex items-center gap-1.5 text-sm"><Link2 className="size-4" aria-hidden="true" /> Nome</Label>
            <Input id="anexo-nome" name="nome" placeholder="Ex.: Briefing aprovado" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anexo-url" className="text-sm">Link (Drive, etc.)</Label>
            <Input id="anexo-url" name="url" type="url" placeholder="https://…" required />
          </div>
        </div>
        {state.error && <p role="alert" className="text-xs text-destructive">{state.error}</p>}
        <div className="flex justify-end">
          <Enviar label="Adicionar link" pendingLabel="Adicionando…" />
        </div>
      </form>
    </div>
  );
}
