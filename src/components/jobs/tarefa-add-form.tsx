"use client";

import { useFormStatus } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

function Add() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      <Plus className="size-4" />
      Adicionar
    </Button>
  );
}

export function TarefaAddForm({
  action,
  usuarios,
}: {
  action: (formData: FormData) => Promise<void>;
  usuarios: { id: string; nome: string }[];
}) {
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <label htmlFor="tarefa-desc" className="sr-only">Nova subtarefa</label>
      <Input id="tarefa-desc" name="descricao" placeholder="Nova subtarefa…" required className="min-w-0 flex-1" />
      <label htmlFor="tarefa-resp" className="sr-only">Responsável da subtarefa</label>
      <select
        id="tarefa-resp"
        name="responsavelId"
        defaultValue=""
        className="h-10 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">Sem responsável</option>
        {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
      </select>
      <Add />
    </form>
  );
}
