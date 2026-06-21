"use client";

import { Copy, Trash2 } from "lucide-react";
import { duplicarPerfil, excluirPerfil } from "@/lib/admin/actions";
import { InlineAction } from "@/components/shared/inline-action";
import { ConfirmButton } from "@/components/shared/confirm-button";

export function PerfilCardActions({
  id,
  nome,
  sistema,
  totalUsuarios,
}: {
  id: string;
  nome: string;
  sistema: boolean;
  totalUsuarios: number;
}) {
  return (
    <div className="flex items-center gap-1">
      <InlineAction action={duplicarPerfil.bind(null, id)} title="Duplicar perfil">
        <Copy className="size-4" aria-hidden="true" />
        <span className="sr-only">Duplicar {nome}</span>
      </InlineAction>

      {!sistema && (
        <ConfirmButton
          action={excluirPerfil.bind(null, id)}
          titulo={`Excluir o perfil "${nome}"?`}
          descricao={
            totalUsuarios > 0
              ? `Há ${totalUsuarios} usuário(s) com este perfil. Reatribua-os antes de excluir.`
              : "Esta ação não pode ser desfeita."
          }
          confirmarLabel="Excluir perfil"
          triggerLabel="Excluir"
          triggerIcon={<Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />}
        />
      )}
    </div>
  );
}
