import Link from "next/link";
import { Plus, Pencil, Copy, Trash2, ArrowRight, ListChecks } from "lucide-react";
import { requireModulo, acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { listarTemplates } from "@/lib/templates/queries";
import { duplicarTemplate, excluirTemplate } from "@/lib/templates/actions";
import { rotuloTipoJob, corTipoJob } from "@/lib/jobs/tipos";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmButton } from "@/components/shared/confirm-button";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  await requireModulo("jobs", "VER");
  const acesso = await acessoAtual();
  const podeEditar = podeModulo(acesso.caps, "jobs", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "jobs", "ADMIN") || acesso.admin;
  const templates = await listarTemplates();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Templates de job"
        descricao="Modelos reutilizáveis (tipo + fluxo de tarefas) para abrir jobs já estruturados."
        acao={podeEditar ? <Button asChild><Link href="/jobs/templates/novo"><Plus className="size-4" /> Novo template</Link></Button> : undefined}
      />

      {templates.length === 0 ? (
        <EmptyState
          titulo="Nenhum template ainda"
          descricao="Crie um modelo do zero, ou salve um job existente como template (botão no próprio job)."
          acao={podeEditar ? <Button asChild><Link href="/jobs/templates/novo"><Plus className="size-4" /> Novo template</Link></Button> : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <Card key={t.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{t.nome}</p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 font-semibold" style={{ backgroundColor: `${corTipoJob(t.tipo)}1f`, color: corTipoJob(t.tipo) }}>
                        {rotuloTipoJob(t.tipo)}
                      </span>
                      <span className="inline-flex items-center gap-1"><ListChecks className="size-3.5" /> {t._count.tarefas} etapas</span>
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button asChild size="sm"><Link href={`/jobs/novo?template=${t.id}`}>Usar <ArrowRight className="size-4" /></Link></Button>
                  {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/jobs/templates/${t.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
                  {podeEditar && (
                    <form action={duplicarTemplate.bind(null, t.id)}>
                      <Button type="submit" variant="outline" size="sm"><Copy className="size-4" /> Duplicar</Button>
                    </form>
                  )}
                  {podeExcluir && (
                    <ConfirmButton
                      action={excluirTemplate.bind(null, t.id)}
                      variant="ghost"
                      triggerIcon={<Trash2 className="size-4" />}
                      triggerLabel="Excluir"
                      titulo="Excluir template?"
                      descricao={`Remover o template “${t.nome}”. Jobs já criados a partir dele não são afetados.`}
                      confirmarLabel="Excluir"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
