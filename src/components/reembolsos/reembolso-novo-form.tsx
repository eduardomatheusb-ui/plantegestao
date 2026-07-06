"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { criarReembolso, type FormState } from "@/lib/reembolsos/actions";
import { MESES } from "@/lib/reembolsos/constants";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Criando…" : "Criar pedido"}</Button>;
}

export function ReembolsoNovoForm({ anoAtual, mesAtual }: { anoAtual: number; mesAtual: number }) {
  const [state, formAction] = useActionState<FormState, FormData>(criarReembolso, {});
  const anos = [anoAtual, anoAtual - 1];

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="competenciaMes">Mês de competência <span className="text-destructive">*</span></Label>
          <select id="competenciaMes" name="competenciaMes" className={sel} defaultValue={mesAtual}>
            {MESES.map((m, i) => (<option key={i} value={i + 1} className="capitalize">{m}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="competenciaAno">Ano <span className="text-destructive">*</span></Label>
          <select id="competenciaAno" name="competenciaAno" className={sel} defaultValue={anoAtual}>
            {anos.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacao">Observação (opcional)</Label>
          <Textarea id="observacao" name="observacao" rows={3} placeholder="Ex.: despesas de deslocamento para gravações do cliente X." />
        </div>
      </div>

      <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
        Depois de criar, você adiciona cada despesa (uma por vez) com valor e comprovante, e envia o pedido para análise do financeiro.
        Pedidos enviados até o dia 30 são pagos até o dia 20 do mês seguinte.
      </p>

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href="/reembolsos">Cancelar</Link></Button>
      </div>
    </form>
  );
}
