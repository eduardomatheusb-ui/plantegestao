"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Check, Copy, Search } from "lucide-react";
import { recarregarSeStale } from "@/lib/stale-action";
import type { AgenteGraficaResultado } from "@/lib/agentes/actions";
import { Button } from "@/components/ui/button";

export function ComparacaoGraficaAssist({
  acao,
  rotulo = "Comparar gráficas",
}: {
  acao: () => Promise<AgenteGraficaResultado>;
  rotulo?: string;
}) {
  const [pendente, iniciar] = useTransition();
  const [texto, setTexto] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  function gerar() {
    setErro(null);
    iniciar(async () => {
      try {
        const r = await acao();
        if (r.error) setErro(r.error);
        else setTexto(r.texto ?? "");
      } catch (e) {
        if (!recarregarSeStale(e)) setErro("Não foi possível consultar o agente agora.");
      }
    });
  }

  async function copiar() {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // A comparação continua visível mesmo se o navegador bloquear a cópia.
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={gerar} disabled={pendente}>
          <Search className="size-4" /> {pendente ? "Consultando..." : rotulo}
        </Button>
        {texto && (
          <Button type="button" variant="ghost" size="sm" onClick={copiar}>
            {copiado ? (
              <>
                <Check className="size-4 text-emerald-600" /> Copiado
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copiar
              </>
            )}
          </Button>
        )}
      </div>

      {erro && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {erro}
        </p>
      )}

      {texto && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Resultado do agente - revise antes de usar.</p>
          <textarea
            readOnly
            value={texto}
            rows={Math.min(24, Math.max(8, texto.split("\n").length + 1))}
            className="w-full rounded-md border border-input bg-muted/40 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
