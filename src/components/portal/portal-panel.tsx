"use client";

import { useState } from "react";
import { Globe, Copy, Check, X, ExternalLink } from "lucide-react";
import { gerarPortal, desativarPortal } from "@/lib/portal/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PortalPanel({ clienteId, link }: { clienteId: string; link: string | null }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!link) return;
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 2000); } catch { /* ignora */ }
  }

  if (!link) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Gere um link de acompanhamento para o cliente ver, sem login, os jobs em andamento, as próximas postagens e as peças que aguardam aprovação.
        </p>
        <form action={async () => { try { await gerarPortal(clienteId); } catch (e) { recarregarSeStale(e); } }}>
          <Button type="submit" size="sm"><Globe className="size-4" /> Ativar portal do cliente</Button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Link do portal</p>
      <div className="flex items-center gap-2">
        <Input readOnly value={link} className="flex-1 text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button type="button" variant="outline" size="sm" onClick={copiar}>
          {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
        </Button>
        <Button asChild variant="outline" size="sm"><a href={link} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Abrir</a></Button>
      </div>
      <form action={async () => { try { await desativarPortal(clienteId); } catch (e) { recarregarSeStale(e); } }}>
        <Button type="submit" variant="ghost" size="sm"><X className="size-4" /> Desativar portal</Button>
      </form>
    </div>
  );
}
