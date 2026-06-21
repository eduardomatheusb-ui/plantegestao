import { History } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

/**
 * Painel de histórico reutilizável — lê o modelo Log para qualquer entidade.
 * (entidadeTipo, entidadeId) identificam o alvo. Serve a todos os módulos.
 */
export async function HistoryPanel({
  entidadeTipo,
  entidadeId,
  limite = 50,
}: {
  entidadeTipo: string;
  entidadeId: string;
  limite?: number;
}) {
  const logs = await db.log.findMany({
    where: { entidadeTipo, entidadeId },
    orderBy: { criadoEm: "desc" },
    take: limite,
    include: { usuario: { select: { nome: true } } },
  });

  if (logs.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <History className="size-4" aria-hidden="true" />
        Sem histórico ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-3 text-sm">
          <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-yellow" aria-hidden="true" />
          <div>
            <p className="text-foreground">
              <span className="font-medium">{log.usuario?.nome ?? "Sistema"}</span> {log.acao}
              {log.de && log.para && (
                <>
                  {" "}
                  <span className="text-muted-foreground">
                    ({log.de} → {log.para})
                  </span>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(log.criadoEm)} ·{" "}
              {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(log.criadoEm)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
