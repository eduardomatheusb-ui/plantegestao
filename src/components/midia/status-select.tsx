"use client";

import { useTransition } from "react";
import { alterarStatusMidia } from "@/lib/midia/actions";
import { MIDIA_STATUS } from "@/lib/midia/constants";
import type { MidiaStatus } from "@prisma/client";

export function MidiaStatusSelect({ id, status }: { id: string; status: MidiaStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status do plano de mídia"
      disabled={pending}
      defaultValue={status}
      onChange={(e) => start(() => void alterarStatusMidia(id, e.target.value as MidiaStatus))}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {MIDIA_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  );
}
