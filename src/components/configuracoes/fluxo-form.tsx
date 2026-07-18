"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { salvarFluxo, type FluxoFormState } from "@/app/(app)/configuracoes/fluxos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Save className="size-4" />
      {pending ? "Salvando…" : "Salvar alterações"}
    </Button>
  );
}

/** Edição das etapas padrão e da regra de área de um tipo de job. */
export function FluxoForm({
  tipo,
  etapas,
  padrao,
  funcoesDisponiveis,
  marcadas,
  extras,
}: {
  tipo: string;
  etapas: string[];
  padrao: string[];
  funcoesDisponiveis: string[];
  marcadas: string[];
  extras: string[];
}) {
  const [estado, acao] = useActionState<FluxoFormState, FormData>(salvarFluxo.bind(null, tipo), {});
  const marcadasLower = marcadas.map((m) => m.toLowerCase());

  return (
    <form action={acao} className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Etapas que nascem com o job</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Escreva <strong>uma etapa por linha</strong>, na ordem em que acontecem. Para tirar uma etapa, apague a
            linha. Para trocar a ordem, mova a linha de lugar. Pode deixar em branco se este tipo não deve nascer com
            etapa nenhuma.
          </p>
          <label htmlFor="etapas" className="sr-only">Etapas, uma por linha</label>
          <textarea
            id="etapas"
            name="etapas"
            rows={9}
            defaultValue={etapas.join("\n")}
            spellCheck={false}
            placeholder={"Briefing\nRoteiro\nProdução / Edição\nRevisão"}
            className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {padrao.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <strong>Padrão de fábrica:</strong> {padrao.join(" › ")}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Quem entra automaticamente</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Marque a <strong>função</strong> de quem cuida deste tipo de peça. Todo job desse tipo já nasce com essas
            pessoas como corresponsáveis. A regra segue a função, não a pessoa: se alguém novo entrar com essa função,
            já passa a participar sozinho.
          </p>

          {funcoesDisponiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma função cadastrada ainda. Preencha o campo <strong>Função</strong> em Cadastros → Colaboradores.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {funcoesDisponiveis.map((f) => (
                <label key={f} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                  <input
                    type="checkbox"
                    name="funcoes"
                    value={f}
                    defaultChecked={marcadasLower.includes(f.toLowerCase())}
                    className="size-4"
                  />
                  {f}
                </label>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="funcoesExtras" className="text-sm font-medium">
              Outros termos de função <span className="font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="funcoesExtras"
              name="funcoesExtras"
              defaultValue={extras.join(", ")}
              placeholder="ex.: audiovisual, editor de vídeo"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <p className="text-xs text-muted-foreground">
              Separe por vírgula. Serve para pegar funções que ainda não existem no cadastro ou que são escritas de
              formas diferentes. Basta a função da pessoa <em>conter</em> o termo (não diferencia maiúscula nem acento).
            </p>
          </div>
        </CardContent>
      </Card>

      {estado.error && <p className="text-sm text-destructive">{estado.error}</p>}
      {estado.ok && <p className="text-sm text-success">{estado.ok}</p>}

      <Salvar />
    </form>
  );
}
