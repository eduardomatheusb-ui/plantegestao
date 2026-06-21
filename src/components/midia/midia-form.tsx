"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarMidiaPlano, type MidiaFormState } from "@/lib/midia/actions";
import { TIPOS_MIDIA } from "@/lib/midia/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { VeiculoTipo } from "@prisma/client";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string; clienteId: string };
type VeiculoOpt = { id: string; nome: string; tipo: VeiculoTipo; contatoNome: string | null };

export type MidiaInicial = Partial<Record<
  "tipo" | "titulo" | "clienteId" | "projetoId" | "responsavelId" | "veiculoId" | "target" | "prazo" | "contatoVeiculo" | "rede" | "tipoRede" | "numOrcamento" | "comissaoPct" | "honorarios" | "bonificacao" | "instrucoesFaturamento",
  string
>>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar plano"}</Button>;
}

export function MidiaForm({
  id,
  inicial = {},
  clientes,
  projetos,
  usuarios,
  veiculos,
  cancelHref,
}: {
  id: string | null;
  inicial?: MidiaInicial;
  clientes: Opt[];
  projetos: ProjetoOpt[];
  usuarios: Opt[];
  veiculos: VeiculoOpt[];
  cancelHref: string;
}) {
  const action = salvarMidiaPlano.bind(null, id);
  const [state, formAction] = useActionState<MidiaFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];

  const [clienteId, setClienteId] = React.useState(inicial.clienteId ?? "");
  const projetosDoCliente = projetos.filter((p) => p.clienteId === clienteId);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de mídia <span className="text-destructive">*</span></Label>
          <select id="tipo" name="tipo" className={sel} defaultValue={inicial.tipo ?? ""} aria-invalid={!!err("tipo")}>
            <option value="">Selecione…</option>
            {TIPOS_MIDIA.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </select>
          {err("tipo") && <p className="text-xs text-destructive">{err("tipo")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} aria-invalid={!!err("titulo")} required />
          {err("titulo") && <p className="text-xs text-destructive">{err("titulo")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={sel} value={clienteId} onChange={(e) => setClienteId(e.target.value)} aria-invalid={!!err("clienteId")}>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {err("clienteId") && <p className="text-xs text-destructive">{err("clienteId")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="projetoId">Projeto</Label>
          <select id="projetoId" name="projetoId" className={sel} defaultValue={inicial.projetoId ?? ""} disabled={!clienteId}>
            <option value="">{clienteId ? "— (sem projeto)" : "Escolha o cliente primeiro"}</option>
            {projetosDoCliente.map((p) => (<option key={p.id} value={p.id}>#{p.numero} {p.nome}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="responsavelId">Responsável</Label>
          <select id="responsavelId" name="responsavelId" className={sel} defaultValue={inicial.responsavelId ?? ""}>
            <option value="">— (eu mesmo)</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="veiculoId">Veículo</Label>
          <select id="veiculoId" name="veiculoId" className={sel} defaultValue={inicial.veiculoId ?? ""}>
            <option value="">— (nenhum)</option>
            {veiculos.map((v) => (<option key={v.id} value={v.id}>{v.nome}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target">Target (público)</Label>
          <Input id="target" name="target" defaultValue={inicial.target ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="prazo">Prazo</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={inicial.prazo ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contatoVeiculo">Contato do veículo</Label>
          <Input id="contatoVeiculo" name="contatoVeiculo" defaultValue={inicial.contatoVeiculo ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="numOrcamento">Nº orçamento</Label>
          <Input id="numOrcamento" name="numOrcamento" defaultValue={inicial.numOrcamento ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rede">Rede</Label>
          <Input id="rede" name="rede" defaultValue={inicial.rede ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoRede">Tipo de rede</Label>
          <Input id="tipoRede" name="tipoRede" defaultValue={inicial.tipoRede ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comissaoPct">Comissão (%)</Label>
          <Input id="comissaoPct" name="comissaoPct" type="number" step="0.01" min="0" defaultValue={inicial.comissaoPct ?? "20"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="honorarios">Honorários (R$)</Label>
          <Input id="honorarios" name="honorarios" type="number" step="0.01" min="0" defaultValue={inicial.honorarios ?? "0"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bonificacao">Bonificação (R$)</Label>
          <Input id="bonificacao" name="bonificacao" type="number" step="0.01" min="0" defaultValue={inicial.bonificacao ?? "0"} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="instrucoesFaturamento">Instruções de faturamento</Label>
          <Textarea id="instrucoesFaturamento" name="instrucoesFaturamento" rows={3} defaultValue={inicial.instrucoesFaturamento ?? ""} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
