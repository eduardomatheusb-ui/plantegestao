"use client";

import { useFormStatus } from "react-dom";
import { adicionarPeca, adicionarGrade, adicionarLinha } from "@/lib/midia/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MESES } from "@/lib/financeiro/constants";

const inp = "h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function AddBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <Plus className="size-4" />
      {pending ? "…" : label}
    </Button>
  );
}

export function PecaAddForm({ planoId }: { planoId: string }) {
  return (
    <form action={adicionarPeca.bind(null, planoId)} className="flex flex-wrap items-center gap-2">
      <Input name="codigo" placeholder="Cód. (auto)" className="h-9 w-24" aria-label="Código da peça" />
      <Input name="nome" placeholder="Nome da peça (criativo)" required className="h-9 min-w-0 flex-1" aria-label="Nome da peça" />
      <AddBtn label="Adicionar peça" />
    </form>
  );
}

export function GradeAddForm({ planoId, anoAtual }: { planoId: string; anoAtual: number }) {
  return (
    <form action={adicionarGrade.bind(null, planoId)} className="flex flex-wrap items-end gap-2">
      <Input name="pracaNome" placeholder="Praça (cidade)" className="h-9" aria-label="Praça" />
      <select name="mes" className={inp} defaultValue={String(new Date().getMonth() + 1)} aria-label="Mês">
        {MESES.map((m, i) => (<option key={i} value={i + 1} className="capitalize">{m}</option>))}
      </select>
      <Input name="ano" type="number" defaultValue={String(anoAtual)} className="h-9 w-24" aria-label="Ano" />
      <AddBtn label="Adicionar grade" />
    </form>
  );
}

export function LinhaAddForm({
  gradeId,
  pecas,
  modo = "diario",
}: {
  gradeId: string;
  pecas: { id: string; codigo: string; nome: string }[];
  modo?: "diario" | "periodo";
}) {
  return (
    <form action={adicionarLinha.bind(null, gradeId)} className="flex flex-wrap items-center gap-2 border-t border-border p-3">
      <select name="pecaId" className={inp} defaultValue="" aria-label="Peça">
        <option value="">Peça…</option>
        {pecas.map((p) => (<option key={p.id} value={p.id}>{p.codigo} · {p.nome}</option>))}
      </select>

      {modo === "periodo" ? (
        <>
          <Input name="produto" placeholder="Produto" className="h-9" aria-label="Produto" />
          <Input name="local" placeholder="Local (linha/ponto)" className="h-9 min-w-0 flex-1" aria-label="Local" />
          <Input name="periodoInicio" type="date" className="h-9" aria-label="Início" />
          <Input name="periodoFim" type="date" className="h-9" aria-label="Fim" />
          <Input name="quantidade" type="number" min="0" step="1" placeholder="Qtd" className="h-9 w-20" aria-label="Total inserções" defaultValue="1" />
          <Input name="valorInsercao" type="number" step="0.01" min="0" placeholder="R$ unit." className="h-9 w-28" aria-label="Valor unitário" />
          <Input name="desconto" type="number" step="0.01" min="0" placeholder="Desc." className="h-9 w-24" aria-label="Desconto" defaultValue="0" />
        </>
      ) : (
        <>
          <Input name="programaNome" placeholder="Programa" className="h-9" aria-label="Programa" />
          <Input name="formato" placeholder='Formato (30")' className="h-9 w-28" aria-label="Formato" />
          <Input name="valorInsercao" type="number" step="0.01" min="0" placeholder="R$/inserção" className="h-9 w-32" aria-label="Valor por inserção" />
        </>
      )}
      <AddBtn label="Adicionar linha" />
    </form>
  );
}
