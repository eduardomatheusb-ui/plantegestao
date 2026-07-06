import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { adicionarComentario, removerComentario } from "@/lib/projetos/actions";
import { CommentsAddForm } from "./comments-add-form";
import { InlineAction } from "./inline-action";
import { iniciais } from "@/lib/format";
import { formatDate } from "@/lib/utils";

/** Destaca menções @Nome e transforma links (http/https) em cliques. */
function renderTexto(texto: string) {
  return texto.split(/(https?:\/\/[^\s]+|@[\p{L}]+)/u).map((p, i) => {
    if (/^https?:\/\//.test(p)) {
      return (
        <a key={i} href={p} target="_blank" rel="noopener noreferrer" className="break-all text-primary underline underline-offset-2 hover:opacity-80">
          {p}
        </a>
      );
    }
    if (/^@[\p{L}]+$/u.test(p)) {
      return <span key={i} className="rounded bg-brand-yellow/25 px-0.5 font-medium text-foreground">{p}</span>;
    }
    return <span key={i}>{p}</span>;
  });
}

export async function CommentsPanel({
  entidadeTipo,
  entidadeId,
}: {
  entidadeTipo: string;
  entidadeId: string;
}) {
  const [user, comentarios, usuarios] = await Promise.all([
    getSessionUser(),
    db.comentario.findMany({
      where: { entidadeTipo, entidadeId },
      orderBy: { criadoEm: "desc" },
      include: { autor: { select: { nome: true } } },
    }),
    db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);

  const add = adicionarComentario.bind(null, entidadeTipo, entidadeId);

  return (
    <div className="space-y-4">
      <CommentsAddForm action={add} usuarios={usuarios} />

      {comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-4">
          {comentarios.map((c) => {
            const podeRemover =
              !!user && (c.autorId === user.id || podePapel(user.papel, "GESTOR"));
            return (
              <li key={c.id} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                  {iniciais(c.autor?.nome)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{c.autor?.nome ?? "Usuário"}</p>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.criadoEm)}{" "}
                        {new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(c.criadoEm)}
                      </span>
                      {podeRemover && (
                        <InlineAction
                          action={removerComentario.bind(null, c.id)}
                          title="Remover comentário"
                        >
                          <Trash2 className="size-3.5" />
                        </InlineAction>
                      )}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">{renderTexto(c.texto)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
