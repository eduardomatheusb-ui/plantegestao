import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { listarNotificacoes } from "@/lib/notificacoes";
import { limparTodas } from "./actions";
import { NotificacaoLinha } from "@/components/layout/notificacao-linha";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

export default async function NotificacoesPage() {
  const user = await requireUser();
  const itens = await listarNotificacoes(user.id, 100);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Notificações"
        descricao="Tudo que envolve você no sistema. Ao abrir uma, ela sai da lista."
        acao={
          itens.length > 0 ? (
            <form action={limparTodas}>
              <Button type="submit" variant="outline" size="sm">
                <Trash2 className="size-4" />
                Limpar todas
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
              {itens.map((n) => (
                <NotificacaoLinha
                  key={n.id}
                  id={n.id}
                  titulo={n.titulo}
                  descricao={n.descricao}
                  url={n.url}
                  atorNome={n.ator?.nome ?? null}
                  criadoEm={n.criadoEm}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
