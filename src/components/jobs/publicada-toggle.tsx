"use client";

import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { marcarPublicada } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

export function PublicadaToggle({ jobId, publicado }: { jobId: string; publicado: boolean }) {
  const [pendente, iniciar] = React.useTransition();
  function alternar() {
    iniciar(async () => {
      try { await marcarPublicada(jobId, !publicado); } catch (e) { recarregarSeStale(e); }
    });
  }
  return (
    <Button type="button" variant="outline" size="sm" onClick={alternar} disabled={pendente}>
      {publicado ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4" />}
      {publicado ? "Publicada" : "Marcar como publicada"}
    </Button>
  );
}
