"use client";

import { useTransition } from "react";
import { alterarStatusOs } from "@/lib/os/actions";
import { OS_STATUS } from "@/lib/os/constants";
import type { OsStatus } from "@prisma/client";

export function OsStatusSelect({ id, status }: { id: string; status: OsStatus }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Status da ordem de serviço"
      disabled={pending}
      defaultValue={status}
      onChange={(e) => start(() => void alterarStatusOs(id, e.target.value as OsStatus))}
      className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      {OS_STATUS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
    </select>
  );
}
