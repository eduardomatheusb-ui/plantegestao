"use client";

import { useTransition } from "react";
import { definirResponsavelTarefa } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";

/** Seletor de dono de uma etapa (subtarefa) — atribui/troca o responsável. */
export function TarefaResponsavel({
  tarefaId,
  atual,
  usuarios,
}: {
  tarefaId: string;
  atual: string | null;
  usuarios: { id: string; nome: string }[];
}) {
  const [pendente, iniciar] = useTransition();
  return (
    <select
      defaultValue={atual ?? ""}
      disabled={pendente}
      title="Responsável por esta etapa"
      aria-label="Responsável pela etapa"
      onChange={(e) => {
        const v = e.target.value || null;
        iniciar(async () => {
          try {
            await definirResponsavelTarefa(tarefaId, v);
          } catch (err) {
            recarregarSeStale(err);
          }
        });
      }}
      className={
        "max-w-[120px] shrink-0 rounded-md border px-1.5 py-1 text-xs " +
        (atual ? "border-input bg-background text-foreground" : "border-dashed border-border bg-transparent text-muted-foreground")
      }
    >
      <option value="">— quem faz? —</option>
      {usuarios.map((u) => (
        <option key={u.id} value={u.id}>
          {u.nome}
        </option>
      ))}
    </select>
  );
}
