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
      {pending ? "Lançando…" : "Apontar tempo"}
    </Button>
  );
}

export function TimesheetAddForm({
  action,
  hoje,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  hoje: string;
}) {
  const [state, formAction] = useActionState<State, FormData>(action, {});
  return (
    <form action={formAction} className="space-y-3 rounded-md border border-border p-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ts-data">Data</Label>
          <Input id="ts-data" name="data" type="date" defaultValue={hoje} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-horas">Horas</Label>
          <Input id="ts-horas" name="horas" type="number" min="0" step="1" defaultValue="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-min">Minutos</Label>
          <Input id="ts-min" name="minutos" type="number" min="0" max="59" step="1" defaultValue="0" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="ts-desc">Descrição (opcional)</Label>
        <Input id="ts-desc" name="descricao" placeholder="No que trabalhou?" />
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
