"use client";

import * as React from "react";
import { CheckCircle2, Circle, ExternalLink, Save } from "lucide-react";
import { marcarPublicada, salvarLinkPublicado } from "@/lib/jobs/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PublicadaToggle({ jobId, publicado, linkPublicado }: { jobId: string; publicado: boolean; linkPublicado?: string | null }) {
  const [pendente, iniciar] = React.useTransition();

  function alternar() {
    iniciar(async () => {
      try { await marcarPublicada(jobId, !publicado); } catch (e) { recarregarSeStale(e); }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={alternar} disabled={pendente}>
          {publicado ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4" />}
          {publicado ? "Publicada" : "Marcar como publicada"}
        </Button>
        {publicado && linkPublicado && (
          <Button asChild variant="ghost" size="sm">
            <a href={linkPublicado} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Ver post
            </a>
          </Button>
        )}
      </div>

      {publicado && (
        <form action={salvarLinkPublicado.bind(null, jobId)} className="flex items-center gap-2">
          <Input
            name="linkPublicado"
            type="url"
            inputMode="url"
            placeholder="Cole a URL do post publicado (opcional)"
            defaultValue={linkPublicado ?? ""}
            className="h-8 flex-1 text-xs"
          />
          <Button type="submit" variant="outline" size="sm"><Save className="size-4" /> Salvar</Button>
        </form>
      )}
    </div>
  );
}
