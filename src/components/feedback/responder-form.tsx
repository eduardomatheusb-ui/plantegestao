"use client";

import { useActionState } from "react";
import { responderFeedback, type FeedbackState } from "@/lib/feedback/actions";

export function ResponderForm({ id }: { id: string }) {
  const [state, action] = useActionState<FeedbackState, FormData>(responderFeedback.bind(null, id), {});
  return (
    <form action={action} className="flex w-full flex-wrap items-center gap-2 pt-1">
      <input
        name="resposta"
        required
        placeholder="Responder (marca como resolvido)…"
        className="min-w-40 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Responder</button>
      {state.error && <span className="w-full text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
