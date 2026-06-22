"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, ThumbsUp, PenLine } from "lucide-react";
import { responderAprovacao, type RespostaState } from "@/lib/aprovacao/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Enviar({ decisao }: { decisao: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || !decisao} className="w-full sm:w-auto">
      {pending ? "Enviando…" : "Enviar resposta"}
    </Button>
  );
}

export function RespostaForm({ token }: { token: string }) {
  const [state, action] = useActionState<RespostaState, FormData>(responderAprovacao.bind(null, token), {});
  const [decisao, setDecisao] = useState("");

  if (state.ok) {
    return (
      <div role="status" className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-semibold">Resposta registrada. Obrigado!</p>
          <p className="mt-1">A equipe da Plante já foi avisada. Você pode fechar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> <span>{state.error}</span>
        </div>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Sua decisão</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-sm transition-colors ${decisao === "aprovado" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950" : "border-input"}`}>
            <input type="radio" name="decisao" value="aprovado" className="size-4" checked={decisao === "aprovado"} onChange={() => setDecisao("aprovado")} />
            <ThumbsUp className="size-5 text-emerald-600" aria-hidden="true" />
            <span className="font-medium">Aprovar a peça</span>
          </label>
          <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 p-3 text-sm transition-colors ${decisao === "ajustes" ? "border-amber-500 bg-amber-50 dark:bg-amber-950" : "border-input"}`}>
            <input type="radio" name="decisao" value="ajustes" className="size-4" checked={decisao === "ajustes"} onChange={() => setDecisao("ajustes")} />
            <PenLine className="size-5 text-amber-600" aria-hidden="true" />
            <span className="font-medium">Solicitar ajustes</span>
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="autor">Seu nome</Label>
        <Input id="autor" name="autor" placeholder="Quem está aprovando" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comentario">
          Comentário {decisao === "ajustes" && <span className="text-destructive">* (descreva os ajustes)</span>}
        </Label>
        <Textarea id="comentario" name="comentario" rows={4} placeholder={decisao === "ajustes" ? "O que precisa mudar?" : "Opcional"} />
      </div>

      <Enviar decisao={decisao} />
    </form>
  );
}
