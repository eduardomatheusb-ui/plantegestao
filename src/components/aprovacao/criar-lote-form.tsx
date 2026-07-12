"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Send } from "lucide-react";
import { criarLoteAprovacao, type CriarLoteState } from "@/lib/aprovacao/lote.actions";
import { rotulosFormatos } from "@/lib/jobs/formatos";
import { rotuloAprovacao } from "@/lib/aprovacao/status";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type JobAprovavel = {
  id: string;
  numero: number;
  titulo: string;
  formatos: string | null;
  prazoPostagem: Date | null;
  aprovacaoStatus: string;
};

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(d));
}

function BotaoCriar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || total === 0}>
      <Send className="size-4" /> {pending ? "Criando…" : `Criar rodada com ${total} peça${total === 1 ? "" : "s"}`}
    </Button>
  );
}

export function CriarLoteForm({ clienteId, jobs }: { clienteId: string; jobs: JobAprovavel[] }) {
  const [state, action] = useActionState<CriarLoteState, FormData>(criarLoteAprovacao, {});
  const [sel, setSel] = useState<Set<string>>(new Set());

  const todos = useMemo(() => jobs.map((j) => j.id), [jobs]);
  const todosMarcados = sel.size === jobs.length && jobs.length > 0;

  function toggle(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="clienteId" value={clienteId} />
      {[...sel].map((id) => (
        <input key={id} type="hidden" name="jobIds" value={id} />
      ))}

      <div className="space-y-2">
        <Label htmlFor="titulo">Título da rodada (opcional)</Label>
        <Input id="titulo" name="titulo" placeholder="Ex.: Pauta de Agosto" className="max-w-sm" />
      </div>

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Nenhuma peça pendente de aprovação para este cliente. Crie jobs de postagem primeiro.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Peças ({sel.size}/{jobs.length})</p>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
              onClick={() => setSel(todosMarcados ? new Set() : new Set(todos))}
            >
              {todosMarcados ? "Desmarcar todas" : "Selecionar todas"}
            </button>
          </div>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {jobs.map((j) => {
              const marcado = sel.has(j.id);
              return (
                <li key={j.id}>
                  <label className={`flex cursor-pointer items-center gap-3 p-3 text-sm transition-colors ${marcado ? "bg-primary/5" : "hover:bg-muted/50"}`}>
                    <input type="checkbox" checked={marcado} onChange={() => toggle(j.id)} className="size-4" />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">
                        <span className="text-muted-foreground">#{j.numero}</span> {j.titulo}
                      </span>
                      {rotulosFormatos(j.formatos).length > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">· {rotulosFormatos(j.formatos).join(", ")}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">{rotuloAprovacao(j.aprovacaoStatus)}</span>
                    {j.prazoPostagem && <span className="shrink-0 text-xs text-muted-foreground">{dataBR(j.prazoPostagem)}</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <BotaoCriar total={sel.size} />
    </form>
  );
}
