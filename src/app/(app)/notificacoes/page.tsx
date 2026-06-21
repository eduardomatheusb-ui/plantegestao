import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { listarNotificacoes } from "@/lib/notificacoes";
import { marcarTodasLidas } from "./actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default async function NotificacoesPage() {
  const user = await requireUser();
  const itens = await listarNotificacoes(user.id, 100);
  const temNaoLida = itens.some((n) => !n.lida);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Notificações"
        descricao="Tudo que envolve você no sistema: atribuições, comentários e mudanças de status."
        acao={
          temNaoLida ? (
            <form action={marcarTodasLidas}>
              <Button type="submit" variant="outline" size="sm">
                <CheckCheck className="size-4" />
                Marcar todas como lidas
              </Button>
            </form>
          ) : undefined
        }
      />

      {itens.length === 0 ? (
        <EmptyState titulo="Sem notificações" descricao="Quando algo envolver você, aparece aqui." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {itens.map((n) => {
                const conteudo = (
                  <span className="flex gap-3">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.lida ? "bg-transparent" : "bg-brand-yellow")} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{n.titulo}</span>
                      {n.descricao && <span className="block text-sm text-muted-foreground">{n.descricao}</span>}
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {n.ator ? `${n.ator.nome} · ` : ""}{formatDate(n.criadoEm)}
                      </span>
                    </span>
                  </span>
                );
                return (
                  <li key={n.id} className={cn(!n.lida && "bg-brand-yellow/5")}>
                    {n.url ? (
                      <Link href={n.url} className="block px-4 py-3 transition-colors hover:bg-muted">{conteudo}</Link>
                    ) : (
                      <div className="px-4 py-3">{conteudo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
