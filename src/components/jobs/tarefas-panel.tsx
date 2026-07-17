import { Square, CheckSquare, Trash2, Lock, ToggleLeft, ToggleRight } from "lucide-react";
import { db } from "@/lib/db";
import { adicionarTarefa, toggleTarefa, removerTarefa, definirWorkflow } from "@/lib/jobs/actions";
import { TarefaAddForm } from "./tarefa-add-form";
import { TarefaPrazo } from "./tarefa-prazo";
import { TarefaResponsavel } from "./tarefa-responsavel";
import { InlineAction } from "@/components/shared/inline-action";
import { cn } from "@/lib/utils";

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function TarefasPanel({
  jobId,
  usuarios,
  workflowAtivo = false,
}: {
  jobId: string;
  usuarios: { id: string; nome: string }[];
  workflowAtivo?: boolean;
}) {
  const tarefas = await db.jobTarefa.findMany({
    where: { jobId },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    include: { responsavel: { select: { nome: true } } },
  });

  const feitas = tarefas.filter((t) => t.concluida).length;
  const add = adicionarTarefa.bind(null, jobId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {tarefas.length === 0 ? "Sem subtarefas" : `${feitas} de ${tarefas.length} concluídas`}
        </span>
        <form action={definirWorkflow.bind(null, jobId, !workflowAtivo)}>
          <button
            type="submit"
            title={workflowAtivo ? "Workflow ativo: cada etapa só conclui após a anterior. Clique para desligar." : "Ligar workflow: concluir as tarefas em sequência."}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
              workflowAtivo ? "border-brand-yellow bg-brand-yellow/15 text-foreground" : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            {workflowAtivo ? <ToggleRight className="size-4" /> : <ToggleLeft className="size-4" />}
            Workflow em sequência
          </button>
        </form>
      </div>

      {workflowAtivo && tarefas.length > 0 && (
        <p className="text-xs text-muted-foreground">
          As etapas seguem em ordem: cada uma libera quando a anterior é concluída.
        </p>
      )}

      {tarefas.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border">
          {tarefas.map((t, i) => {
            const earlierPending = tarefas.slice(0, i).some((x) => !x.concluida);
            const laterDone = tarefas.slice(i + 1).some((x) => x.concluida);
            const bloqueada = workflowAtivo && (t.concluida ? laterDone : earlierPending);
            return (
              <li key={t.id} className="flex items-center gap-2 p-2.5">
                {bloqueada ? (
                  <span className="text-muted-foreground/50" title="Aguardando a etapa anterior (workflow ativo)">
                    <Lock className="size-4" />
                  </span>
                ) : (
                  <InlineAction
                    action={toggleTarefa.bind(null, t.id)}
                    title={t.concluida ? "Marcar como pendente" : "Marcar como concluída"}
                    className={t.concluida ? "text-success" : ""}
                  >
                    {t.concluida ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                  </InlineAction>
                )}
                <span className={cn("min-w-0 flex-1 text-sm", t.concluida && "text-muted-foreground line-through", bloqueada && "text-muted-foreground")}>
                  {t.descricao}
                </span>
                <TarefaPrazo
                  id={t.id}
                  prazo={t.prazo ? ymd(t.prazo) : ""}
                  atrasada={!!t.prazo && !t.concluida && t.prazo.getTime() < Date.now()}
                />
                <TarefaResponsavel tarefaId={t.id} atual={t.responsavelId} usuarios={usuarios} />
                <InlineAction action={removerTarefa.bind(null, t.id)} title="Remover subtarefa">
                  <Trash2 className="size-3.5" />
                </InlineAction>
              </li>
            );
          })}
        </ul>
      )}

      <TarefaAddForm action={add} usuarios={usuarios} />
    </div>
  );
}
