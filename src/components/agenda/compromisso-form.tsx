"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarCompromisso, type CompromissoFormState } from "@/lib/agenda/actions";
import { TIPOS_COMPROMISSO, OPCOES_RECORRENCIA } from "@/lib/agenda/constants";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type CompromissoInicial = Partial<{
  titulo: string; tipo: string; data: string; diaInteiro: boolean;
  horaInicio: string; horaFim: string; clienteId: string; local: string; descricao: string;
  participantes: string[]; recorrenciaDias: string; recorrenciaAte: string; emailsExternos: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar compromisso"}</Button>;
}

export function CompromissoForm({
  id, inicial = {}, clientes, usuarios, cancelHref,
}: {
  id: string | null;
  inicial?: CompromissoInicial;
  clientes: Opt[];
  usuarios: Opt[];
  cancelHref: string;
}) {
  const [state, formAction] = useActionState<CompromissoFormState, FormData>(salvarCompromisso.bind(null, id), {});
  const err = (k: string) => state.fieldErrors?.[k];
  const [diaInteiro, setDiaInteiro] = React.useState(Boolean(inicial.diaInteiro));
  const [recorrencia, setRecorrencia] = React.useState(inicial.recorrenciaDias ?? "");
  const [selecionados, setSelecionados] = React.useState<Set<string>>(() => new Set(inicial.participantes ?? []));
  const todosMarcados = usuarios.length > 0 && usuarios.every((u) => selecionados.has(u.id));

  function toggle(uid: string) {
    setSelecionados((prev) => {
      const p = new Set(prev);
      if (p.has(uid)) p.delete(uid); else p.add(uid);
      return p;
    });
  }
  function alternarTodos() {
    setSelecionados(todosMarcados ? new Set() : new Set(usuarios.map((u) => u.id)));
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} required aria-invalid={!!err("titulo")} placeholder="Ex.: Reunião de alinhamento — Cliente X" />
          {err("titulo") && <p className="text-xs text-destructive">{err("titulo")}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo</Label>
          <select id="tipo" name="tipo" className={sel} defaultValue={inicial.tipo ?? "reuniao"}>
            {TIPOS_COMPROMISSO.map((t) => (<option key={t.key} value={t.key}>{t.label}</option>))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente</Label>
          <select id="clienteId" name="clienteId" className={sel} defaultValue={inicial.clienteId ?? ""}>
            <option value="">— (nenhum)</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="data">Data <span className="text-destructive">*</span></Label>
          <Input id="data" name="data" type="date" defaultValue={inicial.data ?? ""} aria-invalid={!!err("data")} />
          {err("data") && <p className="text-xs text-destructive">{err("data")}</p>}
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="diaInteiro" checked={diaInteiro} onChange={(e) => setDiaInteiro(e.target.checked)} className="size-4 rounded border-input" />
            Dia inteiro
          </label>
        </div>

        {!diaInteiro && (
          <>
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Início</Label>
              <Input id="horaInicio" name="horaInicio" type="time" defaultValue={inicial.horaInicio ?? "09:00"} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Fim (opcional)</Label>
              <Input id="horaFim" name="horaFim" type="time" defaultValue={inicial.horaFim ?? ""} />
            </div>
          </>
        )}

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="local">Local</Label>
          <Input id="local" name="local" defaultValue={inicial.local ?? ""} placeholder="Escritório, Google Meet, endereço do cliente…" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="recorrenciaDias">Recorrência</Label>
          <select id="recorrenciaDias" name="recorrenciaDias" className={sel} value={recorrencia} onChange={(e) => setRecorrencia(e.target.value)}>
            {OPCOES_RECORRENCIA.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>
        {recorrencia && (
          <div className="space-y-2">
            <Label htmlFor="recorrenciaAte">Repetir até (opcional)</Label>
            <Input id="recorrenciaAte" name="recorrenciaAte" type="date" defaultValue={inicial.recorrenciaAte ?? ""} />
            <p className="text-xs text-muted-foreground">Deixe em branco para repetir sem data final.</p>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <div className="flex items-center justify-between">
            <Label>Participantes (equipe)</Label>
            <button type="button" onClick={alternarTodos} className="text-xs font-medium text-brand-yellow underline-offset-2 hover:underline">
              {todosMarcados ? "Limpar todos" : "Marcar todos"}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-md border border-border p-3">
            {usuarios.map((u) => (
              <label key={u.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="participantes" value={u.id} checked={selecionados.has(u.id)} onChange={() => toggle(u.id)} className="size-4 rounded border-input" />
                {u.nome}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="emailsExternos">Convidados externos (e-mails)</Label>
          <Textarea id="emailsExternos" name="emailsExternos" rows={2} defaultValue={inicial.emailsExternos ?? ""} placeholder="cliente@empresa.com, fornecedor@exemplo.com" />
          <p className="text-xs text-muted-foreground">Pessoas de fora do time. Separe por vírgula ou quebra de linha — recebem o convite por e-mail.</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" name="descricao" rows={3} defaultValue={inicial.descricao ?? ""} />
        </div>

        <label className="flex items-start gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="notificarEmail" defaultChecked className="mt-0.5 size-4 rounded border-input" />
          <span>Avisar os envolvidos por e-mail (participantes do time + convidados externos)</span>
        </label>
      </div>

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
