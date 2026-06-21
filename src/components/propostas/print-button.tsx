"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print fixed right-6 top-6 z-10 inline-flex items-center gap-2 rounded-md bg-[#f7ff19] px-4 py-2 text-sm font-semibold text-[#050505] shadow-md hover:brightness-95"
    >
      <Printer className="size-4" />
      Imprimir / Salvar PDF
    </button>
  );
}
