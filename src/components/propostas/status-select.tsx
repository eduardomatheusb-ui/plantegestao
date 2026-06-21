"use client";

import { useTransition } from "react";
import { alterarStatusProposta } from "@/lib/propostas/actions";
import { PROPOSTA_STATUS } from "@/lib/propostas/status";
import type { PropostaStatus } from "@prisma/client";

export function PropostaStatusSelect({
  id,
  status,
  disabled,
}: {
  id: string;
  status: PropostaStatus;
  disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status da proposta"
      disabled={disabled || pending}
      defaultValue={status}
      onChange={(e) => {
        const novo = e.target.value as PropostaStatus;
        start(() => void alterarStatusProposta(id, novo));
      }}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {PROPOSTA_STATUS.map((s) => (
        <option key={s.value} value={s.value}>{s.label}</option>
      ))}
    </select>
  );
}
