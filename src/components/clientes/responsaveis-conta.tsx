"use client";

import * as React from "react";
import { definirResponsavelConta } from "@/lib/clientes/actions";
import { recarregarSeStale } from "@/lib/stale-action";

type Opt = { id: string; nome: string };

/** Selects compactos para definir atendimento/estratégia da conta (salva ao trocar). */
export function ResponsaveisConta({
  clienteId,
  usuarios,
  atendimentoId,
  estrategiaId,
  podeEditar,
}: {
  clienteId: string;
  usuarios: Opt[];
  atendimentoId: string | null;
  estrategiaId: string | null;
  podeEditar: boolean;
}) {
  const [pendente, iniciar] = React.useTransition();

  function definir(papel: "atendimento" | "estrategia", usuarioId: string) {
    iniciar(async () => {
      try {
        await definirResponsavelConta(clienteId, papel, usuarioId || null);
      } catch (e) {
        recarregarSeStale(e);
      }
    });
  }

  const sel =
    "h-8 max-w-44 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Atendimento
        <select
          className={sel}
          disabled={!podeEditar || pendente}
          value={atendimentoId ?? ""}
          onChange={(e) => definir("atendimento", e.target.value)}
        >
          <option value="">—</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Estratégia
        <select
          className={sel}
          disabled={!podeEditar || pendente}
          value={estrategiaId ?? ""}
          onChange={(e) => definir("estrategia", e.target.value)}
        >
          <option value="">—</option>
          {usuarios.map((u) => (
            <option key={u.id} value={u.id}>{u.nome}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
