import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarPerfis } from "@/lib/admin/queries";
import { MODULOS, NIVEL_LABEL } from "@/lib/permissoes";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PerfilCardActions } from "@/components/admin/perfil-card-actions";
import { cn } from "@/lib/utils";

const COR_NIVEL: Record<string, string> = {
  NENHUM: "bg-muted text-muted-foreground",
  VER: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  EDITAR: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  ADMIN: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
};

export default async function PerfisPage() {
  await requireModulo("admin", "ADMIN");
  const perfis = await listarPerfis();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        titulo="Perfis de acesso"
        descricao="Defina o que cada perfil pode fazer em cada módulo. Os perfis-base podem ser editados; novos podem ser criados."
        acao={
          <Button asChild>
            <Link href="/configuracoes/perfis/novo">
              <Plus className="mr-1.5 size-4" aria-hidden="true" /> Novo perfil
            </Link>
          </Button>
        }
      />

      <div className="space-y-4">
        {perfis.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-semibold">{p.nome}</h2>
                  {p.sistema && <Badge variant="secondary">Base</Badge>}
                  <span className="text-xs text-muted-foreground">
                    {p.totalUsuarios} {p.totalUsuarios === 1 ? "usuário" : "usuários"}
                  </span>
                </div>
                {p.descricao && <p className="text-sm text-muted-foreground">{p.descricao}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/configuracoes/perfis/${p.id}`}>
                    <Pencil className="mr-1.5 size-3.5" aria-hidden="true" /> Editar
                  </Link>
                </Button>
                <PerfilCardActions id={p.id} nome={p.nome} sistema={p.sistema} totalUsuarios={p.totalUsuarios} />
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-3">
              {MODULOS.map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", COR_NIVEL[p.caps[m.key]])}>
                    {NIVEL_LABEL[p.caps[m.key]]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
