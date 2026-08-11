"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { descartarNotificacao } from "@/app/(app)/notificacoes/actions";
import { formatDate } from "@/lib/utils";

/**
 * Linha da lista de notificações. Some ao ler: clicar remove a notificação e,
 * se houver destino, navega para ele.
 */
export function NotificacaoLinha({
  id,
  titulo,
  descricao,
  url,
  atorNome,
  criadoEm,
}: {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  atorNome: string | null;
  criadoEm: Date;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  function abrir() {
    iniciar(async () => {
      await descartarNotificacao(id);
      if (url) router.push(url);
      else router.refresh();
    });
  }

  return (
    <li>
      <button
        type="button"
        onClick={abrir}
        disabled={pendente}
        className="block w-full px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-60"
      >
        <span className="flex gap-3">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-yellow" aria-hidden="true" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">{titulo}</span>
            {descricao && <span className="block text-sm text-muted-foreground">{descricao}</span>}
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {atorNome ? `${atorNome} · ` : ""}{formatDate(criadoEm)}
            </span>
          </span>
        </span>
      </button>
    </li>
  );
}
