"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarContrato, type ContratoFormState } from "@/lib/contratos/actions";
import { CONTRATO_STATUS, CONTRATO_TIPOS, CONTRATO_SERVICOS } from "@/lib/contratos/constantes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type ContratoInicial = Partial<{
  clienteId: string; tipo: string; servico: string; descricao: string;
  valorMensal: string; valorTotal: string; diaVencimento: string;
  dataInicio: string; dataFim: string; status: string; reajusteEm: string; reajusteObs: string;
  propostaId: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar contrato"}</Button>;
}

export function ContratoForm({ id, inicial = {}, clientes, cancelHref }: { id: string | null; inicial?: ContratoInicial; clientes: Opt[]; cancelHref: string }) {
  const [state, action] = useActionState<ContratoFormState, FormData>(salvarContrato.bind(null, id), {});
  const [tipo, setTipo] = React.useState(inicial.tipo === "pontual" ? "pontual" : "recorrente");
  const pontual = tipo === "pontual";

  return (
    <form action={action} className="space-y-6" noValidate>
      {inicial.propostaId && <input type="hidden" name="propostaId" value={inicial.propostaId} />}
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
        </div>
      )}

      <fieldset className="space-y-2">
        <Label>Tipo de contrato</Label>
        <div className="flex flex-wrap gap-2">
          {CONTRATO_TIPOS.map((t) => (
            <label key={t.key} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${tipo === t.key ? "border-brand-yellow bg-brand-yellow/10 font-medium" : "border-border text-muted-foreground"}`}>
              <input type="radio" name="tipo" value={t.key} checked={tipo === t.key} onChange={() => setTipo(t.key)} className="size-4" />
              {t.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {pontual ? "Serviço fechado com valor total e validade própria — não entra no MRR." : "Fee mensal recorrente — é a base do MRR."}
        </p>
      </fieldset>

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={sel} defaultValue={inicial.clienteId ?? ""} required>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>

        {pontual ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="servico">Serviço</Label>
              <input list="servicos-lista" id="servico" name="servico" className={sel} defaultValue={inicial.servico ?? ""} placeholder="Ex.: Identidade visual" />
              <datalist id="servicos-lista">{CONTRATO_SERVICOS.map((s) => (<option key={s} value={s} />))}</datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorTotal">Valor total (R$) <span className="text-destructive">*</span></Label>
              <Input id="valorTotal" name="valorTotal" inputMode="decimal" defaultValue={inicial.valorTotal ?? ""} placeholder="ex.: 8000" />
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="valorMensal">Valor mensal (R$) <span className="text-destructive">*</span></Label>
            <Input id="valorMensal" name="valorMensal" inputMode="decimal" defaultValue={inicial.valorMensal ?? ""} placeholder="ex.: 3000" />
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="descricao">Descrição / escopo</Label>
          <Textarea id="descricao" name="descricao" rows={2} defaultValue={inicial.descricao ?? ""} placeholder={pontual ? "Ex.: Criação de identidade visual completa" : "Ex.: Social media + tráfego pago"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Início <span className="text-destructive">*</span></Label>
          <Input id="dataInicio" name="dataInicio" type="date" defaultValue={inicial.dataInicio ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFim">{pontual ? "Validade / entrega até" : "Fim"} <span className="text-xs font-normal text-muted-foreground">{pontual ? "(fim do serviço)" : "(vazio = vigente)"}</span></Label>
          <Input id="dataFim" name="dataFim" type="date" defaultValue={inicial.dataFim ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={sel} defaultValue={inicial.status ?? "ativo"}>
            {CONTRATO_STATUS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
          </select>
        </div>

        {!pontual && (
          <>
            <div className="space-y-2">
              <Label htmlFor="diaVencimento">Dia de cobrança</Label>
              <Input id="diaVencimento" name="diaVencimento" inputMode="numeric" defaultValue={inicial.diaVencimento ?? ""} placeholder="1 a 31" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reajusteEm">Próximo reajuste <span className="text-xs font-normal text-muted-foreground">(opcional)</span></Label>
              <Input id="reajusteEm" name="reajusteEm" type="date" defaultValue={inicial.reajusteEm ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reajusteObs">Regra do reajuste <span className="text-xs font-normal text-muted-foreground">(índice, %)</span></Label>
              <Input id="reajusteObs" name="reajusteObs" defaultValue={inicial.reajusteObs ?? ""} placeholder="Ex.: IPCA ou 8%" />
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
