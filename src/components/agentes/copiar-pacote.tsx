"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

/** Copia o pacote em JSON — é exatamente o que seria entregue ao Claude. */
export function CopiarPacote({ json }: { json: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(json);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* clipboard bloqueado — o JSON continua visível na tela */
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copiar}>
      {copiado ? <Check /> : <Copy />}
      {copiado ? "Copiado" : "Copiar JSON"}
    </Button>
  );
}
