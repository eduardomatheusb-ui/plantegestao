import { ExternalLink, Trash2, Paperclip } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { adicionarAnexo, removerAnexo } from "@/lib/projetos/actions";
import { AttachmentsAddForm } from "./attachments-add-form";
import { InlineAction } from "./inline-action";

export async function AttachmentsPanel({
  entidadeTipo,
  entidadeId,
}: {
  entidadeTipo: string;
  entidadeId: string;
}) {
  const [user, anexos] = await Promise.all([
    getSessionUser(),
    db.anexo.findMany({
      where: { entidadeTipo, entidadeId },
      orderBy: { criadoEm: "desc" },
      include: { criadoPor: { select: { nome: true } } },
    }),
  ]);

  const add = adicionarAnexo.bind(null, entidadeTipo, entidadeId);

  return (
    <div className="space-y-4">
      <AttachmentsAddForm action={add} />

      {anexos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum anexo ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {anexos.map((a) => {
            const podeRemover =
              !!user && (a.criadoPorId === user.id || podePapel(user.papel, "GESTOR"));
            return (
              <li key={a.id} className="flex items-center gap-3 p-3">
                <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium hover:underline"
                >
                  <span className="truncate">{a.nome}</span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
                </a>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {a.criadoPor?.nome}
                </span>
                {podeRemover && (
                  <InlineAction action={removerAnexo.bind(null, a.id)} title="Remover anexo">
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
