"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import { salvarReuniao, type ReuniaoFormState } from "@/lib/reunioes/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
export type ReuniaoInicial = Partial<{
  titulo: string; data: string; clienteId: string; participantes: string;
  ata: string; pauta: string; decisoes: string; proximosPassos: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar ata"}</Button>;
}

export function ReuniaoForm({ id, inicial = {}, clientes, cancelHref }: { id: string | null; inicial?: ReuniaoInicial; clientes: Opt[]; cancelHref: string }) {
  const [state, action] = useActionState<ReuniaoFormState, FormData>(salvarReuniao.bind(null, id), {});

  return (
    <form action={action} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" /> <span>{state.error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} required placeholder="Reunião de alinhamento — Cliente X" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="data">Data <span className="text-destructive">*</span></Label>
          <Input id="data" name="data" type="date" defaultValue={inicial.data ?? ""} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clienteId">Cliente</Label>
          <select id="clienteId" name="clienteId" className={sel} defaultValue={inicial.clienteId ?? ""}>
            <option value="">— Interna / sem cliente</option>
            {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="participantes">Participantes</Label>
          <Input id="participantes" name="participantes" defaultValue={inicial.participantes ?? ""} placeholder="Nomes separados por vírgula" />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ata">Ata (texto livre)</Label>
          <Textarea id="ata" name="ata" rows={8} defaultValue={inicial.ata ?? ""} placeholder="Escreva a ata da reunião do seu jeito. Você também pode gerar um rascunho com a IA na tela da ata e ajustar aqui." />
          <p className="text-xs text-muted-foreground">Campo livre para a ata escrita pela equipe. Os campos abaixo (pauta, decisões, próximos passos) são opcionais e ajudam a organizar e alimentar a IA.</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="pauta">Pauta</Label>
          <Textarea id="pauta" name="pauta" rows={3} defaultValue={inicial.pauta ?? ""} placeholder="O que foi discutido." />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="decisoes">Decisões</Label>
          <Textarea id="decisoes" name="decisoes" rows={3} defaultValue={inicial.decisoes ?? ""} placeholder="O que ficou decidido." />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="proximosPassos">Próximos passos</Label>
          <Textarea id="proximosPassos" name="proximosPassos" rows={3} defaultValue={inicial.proximosPassos ?? ""} placeholder="Quem faz o quê, até quando." />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
