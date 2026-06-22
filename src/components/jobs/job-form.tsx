"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarJob, type JobFormState } from "@/lib/jobs/actions";
import { TIPOS_JOB, TIPO_JOB_PADRAO, tipoJobSocial } from "@/lib/jobs/tipos";
import { PRIORIDADES } from "@/lib/jobs/prioridade";
import { FORMATOS_POST } from "@/lib/jobs/formatos";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string; clienteId: string };

export type JobInicial = {
  tipo?: string;
  prioridade?: string;
  titulo?: string;
  clienteId?: string;
  projetoId?: string;
  responsavelId?: string;
  statusId?: string;
  prazo?: string;
  prazoPostagem?: string;
  legenda?: string;
  briefing?: string;
  formatos?: string[];
  envolvidosIds?: string[];
};

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar job"}</Button>;
}

export function JobForm({
  id,
  inicial = {},
  clientes,
  projetos,
  usuarios,
  statuses,
  cancelHref,
}: {
  id: string | null;
  inicial?: JobInicial;
  clientes: Opt[];
  projetos: ProjetoOpt[];
  usuarios: Opt[];
  statuses: Opt[];
  cancelHref: string;
}) {
  const action = salvarJob.bind(null, id);
  const [state, formAction] = useActionState<JobFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];

  const [tipo, setTipo] = React.useState(inicial.tipo ?? TIPO_JOB_PADRAO);
  const [clienteId, setClienteId] = React.useState(inicial.clienteId ?? "");
  const [projetoId, setProjetoId] = React.useState(inicial.projetoId ?? "");
  const projetosDoCliente = projetos.filter((p) => p.clienteId === clienteId);
  const social = tipoJobSocial(tipo);
  const formatosIniciais = new Set(inicial.formatos ?? []);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo de job <span className="text-destructive">*</span></Label>
          <select id="tipo" name="tipo" className={sel} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPOS_JOB.map((t) => (<option key={t.key} value={t.key}>{t.label}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <select id="prioridade" name="prioridade" className={sel} defaultValue={inicial.prioridade ?? "normal"}>
            {PRIORIDADES.map((p) => (<option key={p.key} value={p.key}>{p.label}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} aria-invalid={!!err("titulo")} required />
          {err("titulo") && <p className="text-xs text-destructive">{err("titulo")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente <span className="text-destructive">*</span></Label>
          <select id="clienteId" name="clienteId" className={sel} value={clienteId}
            onChange={(e) => { setClienteId(e.target.value); setProjetoId(""); }} aria-invalid={!!err("clienteId")}>
            <option value="">Selecione…</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
          {err("clienteId") && <p className="text-xs text-destructive">{err("clienteId")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="projetoId">Campanha / projeto</Label>
          <select id="projetoId" name="projetoId" className={sel} value={projetoId} onChange={(e) => setProjetoId(e.target.value)} disabled={!clienteId}>
            <option value="">{clienteId ? "— (avulso)" : "Escolha o cliente primeiro"}</option>
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
          <Label htmlFor="statusId">Status</Label>
          <select id="statusId" name="statusId" className={sel} defaultValue={inicial.statusId ?? ""}>
            <option value="">Primeiro da fila</option>
            {statuses.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prazo">{social ? "Prazo de criação" : "Prazo"}</Label>
          <Input id="prazo" name="prazo" type="date" defaultValue={inicial.prazo ?? ""} />
        </div>

        {social && (
          <div className="space-y-2">
            <Label htmlFor="prazoPostagem">Prazo de postagem <span className="text-xs font-normal text-muted-foreground">(vai ao ar)</span></Label>
            <Input id="prazoPostagem" name="prazoPostagem" type="date" defaultValue={inicial.prazoPostagem ?? ""} />
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="envolvidos">Envolvidos <span className="text-xs font-normal text-muted-foreground">(segure Ctrl/⌘ para marcar vários)</span></Label>
          <select id="envolvidos" name="envolvidos" multiple defaultValue={inicial.envolvidosIds ?? []}
            className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
        </div>

        {social && (
          <>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-medium">Canais de publicação</legend>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {FORMATOS_POST.map((f) => (
                  <label key={f.key} className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm">
                    <input type="checkbox" name="formatos" value={f.key} defaultChecked={formatosIniciais.has(f.key)} className="size-4" />
                    {f.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="legenda">Legenda</Label>
              <Textarea id="legenda" name="legenda" rows={4} defaultValue={inicial.legenda ?? ""} placeholder="Texto da legenda, hashtags, @menções…" />
            </div>
          </>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="briefing">Briefing</Label>
          <Textarea id="briefing" name="briefing" rows={5} defaultValue={inicial.briefing ?? ""} placeholder="O que precisa ser feito, referências, requisitos…" />
        </div>
      </div>

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
