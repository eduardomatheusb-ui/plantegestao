"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, ThumbsUp, PenLine } from "lucide-react";
import { responderLoteAprovacao, type RespostaLoteState } from "@/lib/aprovacao/lote.actions";
import { PostPreview, type PostPreviewImagem } from "@/components/postagens/post-preview/PostPreview";
import { rotuloFormato } from "@/lib/jobs/formatos";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type LoteItemView = {
  jobId: string;
  numero: number;
  titulo: string;
  legenda: string | null;
  formatos: string[];
  imagens: PostPreviewImagem[];
  jaRespondido: { decisao: string; comentario: string | null } | null;
};

export type LoteClienteView = { nome: string; nomeFantasia: string | null; logoUrl: string | null };

function BotaoEnviar({ total }: { total: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || total === 0} size="lg" className="w-full sm:w-auto">
      {pending ? "Enviando…" : `Enviar ${total} resposta${total === 1 ? "" : "s"}`}
    </Button>
  );
}

export function RespostaLoteForm({
  token,
  cliente,
  itens,
  encerrado,
}: {
  token: string;
  cliente: LoteClienteView;
  itens: LoteItemView[];
  encerrado: boolean;
}) {
  const [state, action] = useActionState<RespostaLoteState, FormData>(responderLoteAprovacao.bind(null, token), {});
  const pendentes = useMemo(() => itens.filter((i) => !i.jaRespondido), [itens]);
  const [decisoes, setDecisoes] = useState<Record<string, string>>({});

  const respondidosAgora = Object.values(decisoes).filter((d) => d === "aprovado" || d === "ajustes").length;

  if (state.ok) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Respostas registradas. Obrigado!</p>
          <p className="mt-1">A equipe da Plante já foi avisada. Você pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-8">
      {/* Barra fixa: nome + contador + enviar */}
      {!encerrado && pendentes.length > 0 && (
        <div className="sticky top-0 z-10 -mx-4 flex flex-col gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1 space-y-1">
            <Label htmlFor="autor" className="text-xs">Seu nome</Label>
            <Input id="autor" name="autor" placeholder="Quem está aprovando" className="max-w-xs" />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {respondidosAgora} de {pendentes.length} respondidas
            </span>
            <BotaoEnviar total={respondidosAgora} />
          </div>
        </div>
      )}

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-10">
        {itens.map((item) => {
          const formatosPreview = item.formatos.length > 0 ? item.formatos : ["outro"];
          const decisao = decisoes[item.jobId] ?? "";
          return (
            <article key={item.jobId} className="space-y-4 border-b border-dashed border-border pb-8 last:border-0">
              <header className="space-y-0.5">
                <h3 className="font-display text-lg font-semibold">
                  <span className="text-muted-foreground">#{item.numero}</span> {item.titulo}
                </h3>
                {item.formatos.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.formatos.map((f) => (
                      <span key={f} className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{rotuloFormato(f)}</span>
                    ))}
                  </div>
                )}
              </header>

              {item.imagens.length > 0 && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {formatosPreview.map((f) => (
                    <div key={f} className="space-y-1.5">
                      <p className="text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{rotuloFormato(f)}</p>
                      <PostPreview formato={f} cliente={cliente} imagens={item.imagens} legenda={item.legenda} />
                    </div>
                  ))}
                </div>
              )}

              {item.legenda && (
                <p className="whitespace-pre-wrap rounded-lg border border-border bg-muted/40 p-3 text-sm">{item.legenda}</p>
              )}

              {item.jaRespondido ? (
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  {item.jaRespondido.decisao === "aprovado" ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  ) : (
                    <PenLine className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  )}
                  <span>
                    {item.jaRespondido.decisao === "aprovado" ? "Aprovada" : "Ajustes solicitados"}
                    {item.jaRespondido.comentario ? ` — “${item.jaRespondido.comentario}”` : ""}
                  </span>
                </div>
              ) : encerrado ? null : (
                <fieldset className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 text-sm transition-colors ${decisao === "aprovado" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-input"}`}>
                      <input type="radio" name={`decisao_${item.jobId}`} value="aprovado" className="size-4" checked={decisao === "aprovado"} onChange={() => setDecisoes((d) => ({ ...d, [item.jobId]: "aprovado" }))} />
                      <ThumbsUp className="size-4 text-emerald-600" /> <span className="font-medium">Aprovar</span>
                    </label>
                    <label className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-2.5 text-sm transition-colors ${decisao === "ajustes" ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : "border-input"}`}>
                      <input type="radio" name={`decisao_${item.jobId}`} value="ajustes" className="size-4" checked={decisao === "ajustes"} onChange={() => setDecisoes((d) => ({ ...d, [item.jobId]: "ajustes" }))} />
                      <PenLine className="size-4 text-amber-600" /> <span className="font-medium">Solicitar ajustes</span>
                    </label>
                  </div>
                  {decisao === "ajustes" && (
                    <Textarea name={`comentario_${item.jobId}`} rows={3} placeholder="O que precisa mudar? *" />
                  )}
                </fieldset>
              )}
            </article>
          );
        })}
      </div>

      {!encerrado && pendentes.length > 0 && (
        <div className="flex justify-end">
          <BotaoEnviar total={respondidosAgora} />
        </div>
      )}
    </form>
  );
}
