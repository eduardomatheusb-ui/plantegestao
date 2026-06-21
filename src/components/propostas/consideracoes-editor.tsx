"use client";

import { useFormStatus } from "react-dom";
import { atualizarConsideracoes } from "@/lib/propostas/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Salvando…" : "Salvar considerações"}
    </Button>
  );
}

export function ConsideracoesEditor({ id, consideracoes }: { id: string; consideracoes: string | null }) {
  return (
    <form action={atualizarConsideracoes.bind(null, id)} className="space-y-2">
      <label htmlFor="consideracoesFinais" className="sr-only">Considerações finais</label>
      <Textarea
        id="consideracoesFinais"
        name="consideracoesFinais"
        rows={4}
        defaultValue={consideracoes ?? ""}
        placeholder="Prazo de entrega, condições de pagamento, observações finais…"
      />
      <div className="flex justify-end">
        <Salvar />
      </div>
    </form>
  );
}
