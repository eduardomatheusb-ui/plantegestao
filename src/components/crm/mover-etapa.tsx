"use client";

import { useTransition } from "react";
import { moverEtapaLead } from "@/lib/crm/actions";
import { ETAPAS_LEAD } from "@/lib/crm/etapas";

export function MoverEtapa({ id, etapa, className }: { id: string; etapa: string; className?: string }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Mover etapa"
      disabled={pending}
      value={etapa}
      onChange={(e) => { const v = e.target.value; start(() => { void moverEtapaLead(id, v); }); }}
      className={className ?? "h-8 w-full rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"}
    >
      {ETAPAS_LEAD.map((e) => (<option key={e.key} value={e.key}>{e.label}</option>))}
    </select>
  );
}
