"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Mostra o link de convite completo (origem + caminho) com botão copiar. */
export function ConviteLink({ url }: { url: string }) {
  const [full, setFull] = useState(url);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setFull(`${window.location.origin}${url}`);
  }, [url]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(full);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard indisponível — usuário pode copiar manualmente */
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        readOnly
        value={full}
        onFocus={(e) => e.currentTarget.select()}
        className="h-9 flex-1 rounded-md border border-input bg-muted/40 px-3 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Link de convite"
      />
      <Button type="button" variant="outline" size="sm" onClick={copiar}>
        {copiado ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        <span className="ml-1.5">{copiado ? "Copiado" : "Copiar"}</span>
      </Button>
    </div>
  );
}
