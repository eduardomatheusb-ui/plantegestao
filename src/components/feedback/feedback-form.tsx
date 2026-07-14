"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { criarFeedback, type FeedbackState } from "@/lib/feedback/actions";
import { FEEDBACK_TIPOS } from "@/lib/feedback/constants";
import { Button } from "@/components/ui/button";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Send className="size-4" /> {pending ? "Enviando…" : "Registrar"}
    </Button>
  );
}

export function FeedbackForm() {
  const [state, action] = useActionState<FeedbackState, FormData>(criarFeedback, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.ok]);

  const inp = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <form ref={ref} action={action} className="space-y-3">
      {state.ok && (
        <p className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 p-2.5 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="size-4" /> Registrado! Obrigado por ajudar a melhorar o TREM. 🌱
        </p>
      )}
      {state.error && (
        <p className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
          <AlertCircle className="size-4" /> {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {FEEDBACK_TIPOS.map((t, i) => (
          <label key={t.key} className="flex cursor-pointer items-center gap-2 rounded-full border border-input px-3 py-1.5 text-sm hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary/10">
            <input type="radio" name="tipo" value={t.key} defaultChecked={i === 0} className="size-3.5" />
            <span className="size-2 rounded-full" style={{ background: t.cor }} aria-hidden="true" />
            {t.label}
          </label>
        ))}
      </div>

      <input name="titulo" required placeholder="Resumo (ex.: botão “Salvar” do job não funciona)" className={inp} />
      <textarea name="descricao" rows={3} placeholder="Detalhes: o que aconteceu, o que você esperava, em qual tela…" className={inp} />
      <input type="hidden" name="pagina" value="" />

      <Enviar />
    </form>
  );
}
