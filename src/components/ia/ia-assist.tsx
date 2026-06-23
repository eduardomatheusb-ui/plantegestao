"use client";

import { useState, useTransition } from "react";
import { Sparkles, Copy, Check, AlertCircle } from "lucide-react";
import type { IaResultado } from "@/lib/ia/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";

/**
 * Botão "Gerar com IA" + área de resultado (sugestão para revisão humana).
 * `acao` é uma server action já vinculada ao contexto (ex.: gerarAtaIA.bind(null, id)).
 */
export function IaAssist({ acao, rotulo = "Gerar com IA" }: { acao: () => Promise<IaResultado>; rotulo?: string }) {
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
        if (!recarregarSeStale(e)) setErro("Não foi possível gerar agora.");
      }
    });
  }

  async function copiar() {
    if (!texto) return;
    try { await navigator.clipboard.writeText(texto); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* ignora */ }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={gerar} disabled={pendente}>
          <Sparkles className="size-4" /> {pendente ? "Gerando…" : rotulo}
        </Button>
        {texto && (
          <Button type="button" variant="ghost" size="sm" onClick={copiar}>
            {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
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
          <p className="text-xs text-muted-foreground">Sugestão da IA — revise antes de usar. Não é texto oficial.</p>
          <textarea
            readOnly
            value={texto}
            rows={Math.min(20, Math.max(6, texto.split("\n").length + 1))}
            className="w-full rounded-md border border-input bg-muted/40 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      )}
    </div>
  );
}
