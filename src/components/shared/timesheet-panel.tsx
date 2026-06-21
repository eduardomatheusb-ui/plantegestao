import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { apontarTempo, removerApontamento } from "@/lib/projetos/actions";
import { TimesheetAddForm } from "./timesheet-add-form";
import { InlineAction } from "./inline-action";
import { formatHoras } from "@/lib/projetos/situacao";
import { formatDate } from "@/lib/utils";

export async function TimesheetPanel({
  entidadeTipo,
  entidadeId,
  hoje,
}: {
  entidadeTipo: "projeto" | "job";
  entidadeId: string;
  hoje: string;
}) {
  const where = entidadeTipo === "projeto" ? { projetoId: entidadeId } : { jobId: entidadeId };

  const [user, apontamentos, agg] = await Promise.all([
    getSessionUser(),
    db.apontamento.findMany({
      where,
      orderBy: { data: "desc" },
      include: { usuario: { select: { nome: true } } },
    }),
    db.apontamento.aggregate({ where, _sum: { minutos: true } }),
  ]);

  const total = agg._sum.minutos ?? 0;
  const add = apontarTempo.bind(null, entidadeTipo, entidadeId);

  return (
    <div className="space-y-4">
      <TimesheetAddForm action={add} hoje={hoje} />

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total apontado</span>
        <span className="font-display text-base font-semibold tabular-nums">{formatHoras(total)}</span>
      </div>

      {apontamentos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum apontamento ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {apontamentos.map((ap) => {
            const podeRemover =
              !!user && (ap.usuarioId === user.id || podePapel(user.papel, "GESTOR"));
            return (
              <li key={ap.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-20 shrink-0 text-muted-foreground">{formatDate(ap.data)}</span>
                <span className="w-14 shrink-0 font-medium tabular-nums">{formatHoras(ap.minutos)}</span>
                <span className="min-w-0 flex-1 truncate">
                  {ap.descricao ?? <span className="text-muted-foreground">—</span>}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {ap.usuario?.nome}
                </span>
                {podeRemover && (
                  <InlineAction action={removerApontamento.bind(null, ap.id)} title="Remover apontamento">
                    <Trash2 className="size-3.5" />
                  </InlineAction>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
