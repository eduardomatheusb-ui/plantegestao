"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarCampanha, type CampanhaFormState } from "@/lib/trafego/actions";
import { PLATAFORMAS, CAMPANHA_STATUS } from "@/lib/trafego/constantes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type CampanhaInicial = Partial<{
  nome: string; clienteId: string; plataforma: string; objetivo: string;
  verba: string; metaLeads: string; metaCpl: string; dataInicio: string; dataFim: string; status: string; observacao: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar campanha"}</Button>;
}

export function CampanhaForm({ id, inicial = {}, clientes, cancelHref }: { id: string | null; inicial?: CampanhaInicial; clientes: Opt[]; cancelHref: string }) {
  const [state, action] = useActionState<CampanhaFormState, FormData>(salvarCampanha.bind(null, id), {});

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="nome">Nome da campanha <span className="text-destructive">*</span></Label>
          <Input id="nome" name="nome" defaultValue={inicial.nome ?? ""} required placeholder="Ex.: Black Friday — conversão" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={sel} defaultValue={inicial.clienteId ?? ""} required>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plataforma">Plataforma</Label>
          <select id="plataforma" name="plataforma" className={sel} defaultValue={inicial.plataforma ?? "meta"}>
            {PLATAFORMAS.map((p) => (<option key={p.key} value={p.key}>{p.label}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="objetivo">Objetivo</Label>
          <Input id="objetivo" name="objetivo" defaultValue={inicial.objetivo ?? ""} placeholder="Conversões, tráfego, alcance…" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="verba">Verba total (R$)</Label>
          <Input id="verba" name="verba" inputMode="decimal" defaultValue={inicial.verba ?? ""} placeholder="ex.: 3000" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaLeads">Meta de leads</Label>
          <Input id="metaLeads" name="metaLeads" inputMode="numeric" defaultValue={inicial.metaLeads ?? ""} placeholder="ex.: 50" />
          <p className="text-xs text-muted-foreground">Usada no Painel Estratégico (metas atingidas).</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="metaCpl">CPL alvo (R$)</Label>
          <Input id="metaCpl" name="metaCpl" inputMode="decimal" defaultValue={inicial.metaCpl ?? ""} placeholder="ex.: 20" />
          <p className="text-xs text-muted-foreground">Custo por lead máximo aceitável.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataInicio">Início</Label>
          <Input id="dataInicio" name="dataInicio" type="date" defaultValue={inicial.dataInicio ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFim">Fim</Label>
          <Input id="dataFim" name="dataFim" type="date" defaultValue={inicial.dataFim ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select id="status" name="status" className={sel} defaultValue={inicial.status ?? "ativa"}>
            {CAMPANHA_STATUS.map((s) => (<option key={s.key} value={s.key}>{s.label}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="observacao">Observação</Label>
          <Textarea id="observacao" name="observacao" rows={3} defaultValue={inicial.observacao ?? ""} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
