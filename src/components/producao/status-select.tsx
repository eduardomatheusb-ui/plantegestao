"use client";

import { useTransition } from "react";
import { alterarStatusProducao } from "@/lib/producao/actions";
import { PRODUCAO_STATUS } from "@/lib/producao/constants";
import type { ProducaoStatus } from "@prisma/client";

export function ProducaoStatusSelect({ id, status }: { id: string; status: ProducaoStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status da ordem"
      disabled={pending}
      defaultValue={status}
      onChange={(e) => start(() => void alterarStatusProducao(id, e.target.value as ProducaoStatus))}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {PRODUCAO_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  );
}
