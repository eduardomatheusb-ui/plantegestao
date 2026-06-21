"use client";

import { useFormStatus } from "react-dom";
import { atualizarIntroducao } from "@/lib/propostas/actions";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" variant="outline" disabled={pending}>
      {pending ? "Salvando…" : "Salvar introdução"}
    </Button>
  );
}

export function IntroducaoEditor({ id, introducao }: { id: string; introducao: string | null }) {
  return (
    <form action={atualizarIntroducao.bind(null, id)} className="space-y-2">
      <label htmlFor="introducao" className="sr-only">Introdução</label>
      <Textarea id="introducao" name="introducao" rows={4} defaultValue={introducao ?? ""} placeholder="Texto de abertura da proposta (contexto, agradecimento, escopo geral)…" />
      <div className="flex justify-end">
        <Salvar />
      </div>
    </form>
  );
}
