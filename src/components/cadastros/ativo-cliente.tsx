"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { definirClientesAtivos } from "@/lib/cadastros/actions";

/** Botão da lista de clientes: ativa ou desativa na hora, sem abrir o cadastro. */
export function AtivoCliente({ id, ativo, nome }: { id: string; ativo: boolean; nome: string }) {
  const router = useRouter();
  const [rodando, iniciar] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={rodando}
      aria-label={ativo ? `Desativar ${nome}` : `Ativar ${nome}`}
      onClick={() =>
        iniciar(async () => {
          await definirClientesAtivos([id], !ativo);
          router.refresh();
        })
      }
    >
      {rodando ? <Loader2 className="size-4 animate-spin" /> : ativo ? <PowerOff className="size-4" /> : <Power className="size-4" />}
      {ativo ? "Desativar" : "Ativar"}
    </Button>
  );
}
