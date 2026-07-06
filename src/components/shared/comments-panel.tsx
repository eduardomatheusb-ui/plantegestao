import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { adicionarComentario } from "@/lib/projetos/actions";
import { CommentsAddForm } from "./comments-add-form";
import { ComentarioItem } from "./comentario-item";
import { formatDate } from "@/lib/utils";

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
  const ehGestor = !!user && podePapel(user.papel, "GESTOR");

  return (
    <div className="space-y-4">
      <CommentsAddForm action={add} usuarios={usuarios} />

      {comentarios.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
      ) : (
        <ul className="space-y-4">
          {comentarios.map((c) => {
            const dono = !!user && c.autorId === user.id;
            const quando = `${formatDate(c.criadoEm)} ${new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(c.criadoEm)}`;
            return (
              <ComentarioItem
                key={c.id}
                id={c.id}
                autorNome={c.autor?.nome ?? "Usuário"}
                texto={c.texto}
                quando={quando}
                editado={!!c.editadoEm}
                podeEditar={dono || ehGestor}
                podeRemover={dono || ehGestor}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}
