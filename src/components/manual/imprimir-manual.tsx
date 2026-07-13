"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Imprime o iframe do manual — a paginação A4 nativa do documento gera as folhas reais. */
export function ImprimirManual({ frameId }: { frameId: string }) {
  function imprimir() {
    const frame = document.getElementById(frameId) as HTMLIFrameElement | null;
    const win = frame?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  return (
    <Button type="button" variant="outline" onClick={imprimir}>
      <Printer className="size-4" /> Ler em páginas (PDF)
    </Button>
  );
}
