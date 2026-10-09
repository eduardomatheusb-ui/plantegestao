"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { arquivarCadastro } from "@/lib/cadastros/actions";

/**
 * Botão Ativar/Desativar dos cadastros sem "situação" (fornecedores,
 * colaboradores…). Nesses, desativar e arquivar são o mesmo campo, então ele
 * chama o arquivar e troca na hora, sem diálogo: é reversível pelo mesmo botão.
 */
export function AtivoCadastro({
  slug,
  id,
  ativo,
  nome,
}: {
  slug: string;
  id: string;
  ativo: boolean;
  nome: string;
}) {
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
          await arquivarCadastro(slug, id, ativo);
          router.refresh();
        })
      }
    >
      {rodando ? <Loader2 className="size-4 animate-spin" /> : ativo ? <PowerOff className="size-4" /> : <Power className="size-4" />}
      {ativo ? "Desativar" : "Ativar"}
    </Button>
  );
}
