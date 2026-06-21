"use client";

import { useTransition } from "react";
import { alterarStatusProjeto } from "@/lib/projetos/actions";
import { PROJETO_STATUS } from "@/lib/projetos/situacao";
import type { ProjetoStatus } from "@prisma/client";

export function StatusSelect({
  id,
  status,
  disabled,
}: {
  id: string;
  status: ProjetoStatus;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <select
      aria-label="Status do projeto"
      disabled={disabled || pending}
      defaultValue={status}
      onChange={(e) => {
        const novo = e.target.value as ProjetoStatus;
        start(() => {
          void alterarStatusProjeto(id, novo);
        });
      }}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {PROJETO_STATUS.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
