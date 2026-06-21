import { Square, CheckSquare, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { adicionarTarefa, toggleTarefa, removerTarefa } from "@/lib/jobs/actions";
import { TarefaAddForm } from "./tarefa-add-form";
import { InlineAction } from "@/components/shared/inline-action";
import { iniciais } from "@/lib/format";
import { cn } from "@/lib/utils";

export async function TarefasPanel({
  jobId,
  usuarios,
}: {
  jobId: string;
  usuarios: { id: string; nome: string }[];
}) {
  const tarefas = await db.jobTarefa.findMany({
    where: { jobId },
    orderBy: [{ concluida: "asc" }, { ordem: "asc" }, { criadoEm: "asc" }],
    include: { responsavel: { select: { nome: true } } },
  });

  const feitas = tarefas.filter((t) => t.concluida).length;
  const add = adicionarTarefa.bind(null, jobId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {tarefas.length === 0 ? "Sem subtarefas" : `${feitas} de ${tarefas.length} concluídas`}
        </span>
      </div>

      {tarefas.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {tarefas.map((t) => (
            <li key={t.id} className="flex items-center gap-2 p-2.5">
              <InlineAction
                action={toggleTarefa.bind(null, t.id)}
                title={t.concluida ? "Marcar como pendente" : "Marcar como concluída"}
                className={t.concluida ? "text-success" : ""}
              >
                {t.concluida ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
              </InlineAction>
              <span className={cn("min-w-0 flex-1 text-sm", t.concluida && "text-muted-foreground line-through")}>
                {t.descricao}
              </span>
              {t.responsavel && (
                <span
                  className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold"
                  title={t.responsavel.nome}
                >
                  {iniciais(t.responsavel.nome)}
                </span>
              )}
              <InlineAction action={removerTarefa.bind(null, t.id)} title="Remover subtarefa">
                <Trash2 className="size-3.5" />
              </InlineAction>
            </li>
          ))}
        </ul>
      )}

      <TarefaAddForm action={add} usuarios={usuarios} />
    </div>
  );
}
