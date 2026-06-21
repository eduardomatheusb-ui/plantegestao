"use client";

import { useFormStatus } from "react-dom";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "Enviando…" : "Comentar"}
    </Button>
  );
}

export function CommentsAddForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="texto" className="sr-only">
        Novo comentário
      </label>
      <Textarea id="texto" name="texto" placeholder="Escreva um comentário…" required />
      <div className="flex justify-end">
        <Enviar />
      </div>
    </form>
  );
}
