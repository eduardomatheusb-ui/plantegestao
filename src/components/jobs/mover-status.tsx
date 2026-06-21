"use client";

import { useTransition } from "react";
import { moverJobStatus } from "@/lib/jobs/actions";

type StatusOpt = { id: string; nome: string };

/** Select acessível para mover o job entre status (colunas do kanban). */
export function MoverStatus({
  jobId,
  statusId,
  statuses,
  className,
}: {
  jobId: string;
  statusId: string;
  statuses: StatusOpt[];
  className?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Mover para status"
      disabled={pending}
      value={statusId}
      onChange={(e) => {
        const novo = e.target.value;
        start(() => {
          void moverJobStatus(jobId, novo);
        });
      }}
      className={
        className ??
        "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      }
    >
      {statuses.map((s) => (
        <option key={s.id} value={s.id}>
          {s.nome}
        </option>
      ))}
    </select>
  );
}
