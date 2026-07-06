"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil } from "lucide-react";
import { atualizarCabecalho, type FormState } from "@/lib/reembolsos/actions";
import { MESES } from "@/lib/reembolsos/constants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Salvando…" : "Salvar"}</Button>;
}

export function CabecalhoForm({
  id, ano, mes, observacao, anoAtual,
}: {
  id: string;
  ano: number;
  mes: number;
  observacao: string;
  anoAtual: number;
}) {
  const [editando, setEditando] = React.useState(false);
  const action = React.useCallback((prev: FormState, fd: FormData) => atualizarCabecalho(id, prev, fd), [id]);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  React.useEffect(() => { if (state.ok) setEditando(false); }, [state]);
  const anos = [anoAtual, anoAtual - 1];

  if (!editando) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setEditando(true)}><Pencil className="size-3.5" /> Editar dados</Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-border p-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="c-mes">Mês</Label>
          <select id="c-mes" name="competenciaMes" className={sel} defaultValue={mes}>
            {MESES.map((m, i) => (<option key={i} value={i + 1} className="capitalize">{m}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-ano">Ano</Label>
          <select id="c-ano" name="competenciaAno" className={sel} defaultValue={ano}>
            {anos.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="c-obs">Observação</Label>
        <Textarea id="c-obs" name="observacao" rows={2} defaultValue={observacao} />
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="flex items-center gap-2">
        <Salvar />
        <Button type="button" variant="ghost" size="sm" onClick={() => setEditando(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
