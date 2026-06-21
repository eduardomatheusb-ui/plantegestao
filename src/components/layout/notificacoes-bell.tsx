"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { marcarLida, marcarTodasLidas } from "@/app/(app)/notificacoes/actions";
import { cn } from "@/lib/utils";

export type NotificacaoItem = {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string | null;
  lida: boolean;
  criadoEm: Date;
  ator: { nome: string } | null;
};

function tempoRelativo(d: Date): string {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "ontem";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(d));
}

export function NotificacoesBell({ naoLidas, recentes }: { naoLidas: number; recentes: NotificacaoItem[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();

  function abrir(n: NotificacaoItem) {
    iniciar(async () => {
      if (!n.lida) await marcarLida(n.id);
      if (n.url) router.push(n.url);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Notificações${naoLidas > 0 ? ` (${naoLidas} não lidas)` : ""}`}
      >
        <Bell className="size-5" aria-hidden="true" />
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold">Notificações</span>
          {naoLidas > 0 && (
            <button
              type="button"
              onClick={() => iniciar(async () => { await marcarTodasLidas(); router.refresh(); })}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Marcar todas
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recentes.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Nada por aqui ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentes.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => abrir(n)}
                    className={cn(
                      "flex w-full gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted",
                      !n.lida && "bg-brand-yellow/10",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.lida ? "bg-transparent" : "bg-brand-yellow")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{n.titulo}</span>
                      {n.descricao && <span className="block truncate text-xs text-muted-foreground">{n.descricao}</span>}
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {n.ator ? `${n.ator.nome} · ` : ""}{tempoRelativo(n.criadoEm)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border">
          <Link href="/notificacoes" className="block px-3 py-2 text-center text-sm font-medium text-foreground hover:bg-muted">
            Ver todas
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
