"use client";

import * as React from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type TarefaLinha = { descricao: string; responsavelId: string; prazoRelativoDias: string };
type Opt = { id: string; nome: string };

const sel = "h-9 rounded-md border border-input bg-background px-2 text-sm";

/** Lista editável de tarefas do template; serializa em hidden input `tarefas` (JSON). */
export function TemplateTarefasBuilder({ inicial, usuarios }: { inicial: TarefaLinha[]; usuarios: Opt[] }) {
  const [linhas, setLinhas] = React.useState<TarefaLinha[]>(
    inicial.length ? inicial : [{ descricao: "", responsavelId: "", prazoRelativoDias: "" }],
  );

  const set = (i: number, campo: keyof TarefaLinha, v: string) =>
    setLinhas((prev) => prev.map((l, idx) => (idx === i ? { ...l, [campo]: v } : l)));
  const add = () => setLinhas((prev) => [...prev, { descricao: "", responsavelId: "", prazoRelativoDias: "" }]);
  const remover = (i: number) => setLinhas((prev) => prev.filter((_, idx) => idx !== i));
  const mover = (i: number, dir: -1 | 1) =>
    setLinhas((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const cp = [...prev];
      [cp[i], cp[j]] = [cp[j], cp[i]];
      return cp;
    });

  const payload = JSON.stringify(
    linhas
      .filter((l) => l.descricao.trim())
      .map((l) => ({ descricao: l.descricao.trim(), responsavelId: l.responsavelId || null, prazoRelativoDias: l.prazoRelativoDias === "" ? null : Number(l.prazoRelativoDias) })),
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name="tarefas" value={payload} />
      <div className="hidden gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[1fr_10rem_7rem_auto]">
        <span>Etapa</span><span>Responsável</span><span>Prazo (dias)</span><span />
      </div>
      {linhas.map((l, i) => (
        <div key={i} className="grid grid-cols-1 items-center gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr_10rem_7rem_auto] sm:border-0 sm:p-0">
          <Input value={l.descricao} onChange={(e) => set(i, "descricao", e.target.value)} placeholder={`Etapa ${i + 1}`} />
          <select className={sel} value={l.responsavelId} onChange={(e) => set(i, "responsavelId", e.target.value)}>
            <option value="">— (nenhum)</option>
            {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
          </select>
          <Input type="number" min={0} value={l.prazoRelativoDias} onChange={(e) => set(i, "prazoRelativoDias", e.target.value)} placeholder="—" title="Dias após o início do job" />
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => mover(i, -1)} title="Subir" className="text-muted-foreground hover:text-foreground disabled:opacity-30" disabled={i === 0}>
              <GripVertical className="size-4" />
            </button>
            <button type="button" onClick={() => remover(i)} title="Remover" className="text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}><Plus className="size-4" /> Adicionar etapa</Button>
    </div>
  );
}
