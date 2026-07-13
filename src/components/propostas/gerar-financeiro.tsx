"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Wallet, AlertCircle } from "lucide-react";
import { gerarFinanceiroDaProposta, type FinanceiroPropostaState } from "@/lib/propostas/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

function Enviar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Lançando…" : "Lançar receita"}</Button>;
}

/** Abre o lançamento da receita da proposta no financeiro (à vista ou parcelado). */
export function GerarFinanceiro({ propostaId, valorLabel }: { propostaId: string; valorLabel: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [state, action] = useActionState<FinanceiroPropostaState, FormData>(gerarFinanceiroDaProposta.bind(null, propostaId), {});
  const [parcelado, setParcelado] = React.useState(false);
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button type="button" size="sm" onClick={() => setAberto(true)}><Wallet className="size-4" /> Lançar no financeiro</Button>
      <DialogContent>
        <DialogHeader><DialogTitle>Lançar receita da proposta</DialogTitle></DialogHeader>
        <form action={action} className="space-y-4">
          {state.error && (
            <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
              <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">Valor da proposta: <strong className="text-foreground">{valorLabel}</strong>. A receita entra ligada ao cliente e ao projeto.</p>

          <fieldset className="space-y-2">
            <Label>Condição</Label>
            <div className="flex gap-2">
              <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${!parcelado ? "border-brand-yellow bg-brand-yellow/10 font-medium" : "border-border text-muted-foreground"}`}>
                <input type="radio" name="condicao" value="A_VISTA" checked={!parcelado} onChange={() => setParcelado(false)} className="size-4" /> À vista
              </label>
              <label className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm ${parcelado ? "border-brand-yellow bg-brand-yellow/10 font-medium" : "border-border text-muted-foreground"}`}>
                <input type="radio" name="condicao" value="PARCELADO" checked={parcelado} onChange={() => setParcelado(true)} className="size-4" /> Parcelado
              </label>
            </div>
          </fieldset>

          {parcelado && (
            <div className="space-y-2">
              <Label htmlFor="numParcelas">Número de parcelas</Label>
              <Input id="numParcelas" name="numParcelas" inputMode="numeric" defaultValue="2" placeholder="ex.: 3" />
              <p className="text-xs text-muted-foreground">Divide o total em parcelas mensais iguais, a partir das datas abaixo.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">1º vencimento</Label>
              <Input id="dataVencimento" name="dataVencimento" type="date" defaultValue={hoje} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataCompetencia">Competência</Label>
              <Input id="dataCompetencia" name="dataCompetencia" type="date" defaultValue={hoje} required />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Enviar />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
