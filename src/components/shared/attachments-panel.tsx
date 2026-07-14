import { ExternalLink, Trash2, Paperclip, FileDown, PlayCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { adicionarAnexo, enviarArquivoAnexo, removerAnexo } from "@/lib/projetos/actions";
import { driveEmbedInfo } from "@/lib/anexos/embed";
import { AttachmentsAddForm } from "./attachments-add-form";
import { InlineAction } from "./inline-action";

function fmtTamanho(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const addFile = enviarArquivoAnexo.bind(null, entidadeTipo, entidadeId);

  return (
    <div className="space-y-4">
      <AttachmentsAddForm action={add} fileAction={addFile} />

      {anexos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum anexo ainda.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {anexos.map((a) => {
            const podeRemover =
              !!user && (a.criadoPorId === user.id || podePapel(user.papel, "GESTOR"));
            const ehArquivo = a.tipo === "arquivo";
            const href = ehArquivo ? `/api/anexos/${a.id}` : (a.url ?? "#");
            const Icon = ehArquivo ? FileDown : ExternalLink;
            const emb = a.tipo === "link" ? driveEmbedInfo(a.url) : null;
            return (
              <li key={a.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 flex-1 items-center gap-1 text-sm font-medium hover:underline"
                  >
                    <span className="truncate">{a.nome}</span>
                    {ehArquivo && a.tamanho ? (
                      <span className="shrink-0 text-xs font-normal text-muted-foreground">· {fmtTamanho(a.tamanho)}</span>
                    ) : null}
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                  </a>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {a.criadoPor?.nome}
                  </span>
                  {podeRemover && (
                    <InlineAction action={removerAnexo.bind(null, a.id)} title="Remover anexo">
                      <Trash2 className="size-3.5" />
                    </InlineAction>
                  )}
                </div>
                {emb && (
                  <details className="mt-2">
                    <summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <PlayCircle className="size-3.5" aria-hidden="true" />
                      {emb.tipo === "pasta" ? "Ver arquivos da pasta" : "Ver prévia"}
                    </summary>
                    <div className="mt-2 overflow-hidden rounded-lg border border-border bg-black" style={{ maxWidth: emb.tipo === "pasta" ? 480 : 260, height: 340 }}>
                      <iframe src={emb.src} className="h-full w-full" allow="fullscreen" allowFullScreen title={a.nome} loading="lazy" />
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
