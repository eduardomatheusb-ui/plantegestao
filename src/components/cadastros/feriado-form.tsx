"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarFeriado, type FeriadoFormState } from "@/lib/feriados/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Adicionar feriado"}</Button>;
}

export function FeriadoForm() {
  const [state, formAction] = useActionState<FeriadoFormState, FormData>(salvarFeriado, {});
  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <Label htmlFor="data">Data</Label>
        <Input id="data" name="data" type="date" required className="w-44" />
      </div>
      <div className="space-y-1.5 min-w-48 flex-1">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" required placeholder="Ex.: Nossa Senhora Aparecida" />
      </div>
      <Salvar />
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
