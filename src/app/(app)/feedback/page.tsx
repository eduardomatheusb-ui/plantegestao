import { Bug, HelpCircle, Lightbulb, MessageSquarePlus } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { listarFeedbacks } from "@/lib/feedback/queries";
import { mudarStatusFeedback } from "@/lib/feedback/actions";
import { ResponderForm } from "@/components/feedback/responder-form";
import { rotuloTipo, corTipo, rotuloStatus, corStatus, FEEDBACK_STATUS } from "@/lib/feedback/constants";
import { PageHeader } from "@/components/shared/page-header";
import { TextoComLinks } from "@/components/shared/texto-com-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { formatDate } from "@/lib/utils";

const iconeTipo = (t: string) => (t === "erro" ? Bug : t === "duvida" ? HelpCircle : Lightbulb);

export default async function FeedbackPage() {
  const user = await requireUser();
  const podeGerir = podePapel(user.papel, "GESTOR");
  const itens = await listarFeedbacks();
  const abertos = itens.filter((i) => i.status !== "resolvido");
  const resolvidos = itens.filter((i) => i.status === "resolvido");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Melhorias e erros"
        descricao="Registre erros, dúvidas e sugestões. Tudo que você mandar aqui a gente lê e acompanha."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><MessageSquarePlus className="size-4" /> Registrar</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedbackForm />
        </CardContent>
      </Card>

      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nada registrado ainda. Seja o primeiro. 🌱</p>
      ) : (
        <div className="space-y-6">
          <Secao titulo={`Em aberto (${abertos.length})`} itens={abertos} podeGerir={podeGerir} iconeTipo={iconeTipo} />
          {resolvidos.length > 0 && (
            <Secao titulo={`Resolvidos (${resolvidos.length})`} itens={resolvidos} podeGerir={podeGerir} iconeTipo={iconeTipo} />
          )}
        </div>
      )}
    </div>
  );
}

function Secao({
  titulo,
  itens,
  podeGerir,
  iconeTipo,
}: {
  titulo: string;
  itens: Awaited<ReturnType<typeof listarFeedbacks>>;
  podeGerir: boolean;
  iconeTipo: (t: string) => typeof Bug;
}) {
  if (itens.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titulo}</h2>
      <div className="space-y-3">
        {itens.map((f) => {
          const Icone = iconeTipo(f.tipo);
          return (
            <Card key={f.id}>
              <CardContent className="space-y-2 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${corTipo(f.tipo)}22`, color: corTipo(f.tipo) }}>
                    <Icone className="size-3" /> {rotuloTipo(f.tipo)}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: `${corStatus(f.status)}22`, color: corStatus(f.status) }}>
                    {rotuloStatus(f.status)}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {f.autor?.nome ?? "—"} · {formatDate(f.criadoEm)}
                  </span>
                </div>

                <p className="text-sm font-medium">{f.titulo}</p>
                {f.descricao && <TextoComLinks texto={f.descricao} className="text-sm text-muted-foreground" />}

                {f.resposta && (
                  <div className="rounded-md border-l-2 border-primary bg-muted/40 p-3 text-sm">
                    <p className="mb-0.5 text-xs font-semibold text-muted-foreground">Resposta {f.respondidoPor ? `· ${f.respondidoPor.nome}` : ""}</p>
                    <TextoComLinks texto={f.resposta} />
                  </div>
                )}

                {podeGerir && (
                  <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    {FEEDBACK_STATUS.map((s) => (
                      <form key={s.key} action={mudarStatusFeedback.bind(null, f.id, s.key)}>
                        <button
                          type="submit"
                          disabled={f.status === s.key}
                          className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-40"
                          style={f.status === s.key ? { borderColor: corStatus(s.key), color: corStatus(s.key) } : undefined}
                        >
                          {s.label}
                        </button>
                      </form>
                    ))}
                    {!f.resposta && <ResponderForm id={f.id} />}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
