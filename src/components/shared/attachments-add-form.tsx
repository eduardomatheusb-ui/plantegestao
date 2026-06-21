"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type State = { error?: string };

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Adicionando…" : "Adicionar link"}
    </Button>
  );
}

export function AttachmentsAddForm({
  action,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
}) {
  const [state, formAction] = useActionState<State, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="anexo-nome">Nome</Label>
          <Input id="anexo-nome" name="nome" placeholder="Ex.: Briefing aprovado" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="anexo-url">Link (Drive, etc.)</Label>
          <Input id="anexo-url" name="url" type="url" placeholder="https://…" required />
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-xs text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <Enviar />
      </div>
    </form>
  );
}
