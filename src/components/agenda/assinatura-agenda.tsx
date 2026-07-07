"use client";

import * as React from "react";
import { Copy, Check, RefreshCw, CalendarPlus } from "lucide-react";
import { regenerarTokenAgenda } from "@/lib/agenda/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

export function AssinaturaAgenda({ url, podeRegenerar }: { url: string; podeRegenerar: boolean }) {
  const [copiado, setCopiado] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();

  async function copiar() {
    try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* ignora */ }
  }
  function regenerar() {
    if (!window.confirm("Gerar um link novo? O link antigo para de funcionar e quem já assinou precisará assinar de novo.")) return;
    iniciar(async () => { try { await regenerarTokenAgenda(); } catch (e) { recarregarSeStale(e); } });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-medium"><CalendarPlus className="size-4" /> Assinar no Google/Apple Agenda</p>
      <p className="text-xs text-muted-foreground">
        No Google Agenda: <strong>Outras agendas → + → Assinar de um URL</strong> e cole o link abaixo. No Apple: <strong>Arquivo → Nova assinatura de calendário</strong>. A agenda atualiza sozinha (somente leitura no Google).
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded border border-border bg-muted/50 px-2 py-1.5 text-xs">{url}</code>
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar link</>}
        </Button>
        {podeRegenerar && (
          <Button type="button" variant="ghost" size="sm" onClick={regenerar} disabled={pendente} title="Gerar link novo">
            <RefreshCw className="size-4" /> Novo link
          </Button>
        )}
      </div>
    </div>
  );
}
