import Link from "next/link";
import { ArrowLeft, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import { requirePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { moverOrdemStatus, excluirJobStatus } from "@/lib/jobs/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { InlineAction } from "@/components/shared/inline-action";
import { StatusAddForm, StatusEditForm } from "@/components/jobs/status-config";

export default async function JobStatusConfigPage() {
  await requirePapel("GESTOR");

  const statuses = await db.jobStatus.findMany({
    orderBy: { ordem: "asc" },
    include: { _count: { select: { jobs: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Status dos jobs"
        descricao="As colunas do kanban. A ordem aqui é a ordem do quadro."
        acao={
          <Button asChild variant="outline">
            <Link href="/jobs">
              <ArrowLeft className="size-4" />
              Voltar aos jobs
            </Link>
          </Button>
        }
      />

      <StatusAddForm />

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {statuses.map((s, i) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 p-3">
              <div className="flex flex-col">
                <InlineAction action={moverOrdemStatus.bind(null, s.id, "cima")} title="Subir" className={i === 0 ? "pointer-events-none opacity-30" : ""}>
                  <ArrowUp className="size-3.5" />
                </InlineAction>
                <InlineAction action={moverOrdemStatus.bind(null, s.id, "baixo")} title="Descer" className={i === statuses.length - 1 ? "pointer-events-none opacity-30" : ""}>
                  <ArrowDown className="size-3.5" />
                </InlineAction>
              </div>

              <StatusEditForm id={s.id} nome={s.nome} cor={s.cor} isConcluido={s.isConcluido} />

              <div className="flex items-center gap-2">
                {s.isConcluido && <Badge variant="success">concluído</Badge>}
                <Badge variant="muted">{s._count.jobs} job(s)</Badge>
                <ConfirmButton
                  action={excluirJobStatus.bind(null, s.id)}
                  variant="ghost"
                  triggerIcon={<Trash2 className="size-4" />}
                  triggerLabel=""
                  titulo={`Excluir status "${s.nome}"?`}
                  descricao="Só é possível excluir status sem jobs vinculados."
                  confirmarLabel="Excluir"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
