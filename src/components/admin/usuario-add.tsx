"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import { convidarUsuario, type AdminFormState } from "@/lib/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ConviteLink } from "@/components/admin/convite-link";

type Colaborador = { id: string; nome: string; email: string | null; funcao: string | null };
type Perfil = { id: string; nome: string };

function Enviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <UserPlus className="mr-1.5 size-4" aria-hidden="true" />
      {pending ? "Enviando…" : "Enviar acesso"}
    </Button>
  );
}

export function UsuarioAdd({ colaboradores, perfis }: { colaboradores: Colaborador[]; perfis: Perfil[] }) {
  const [state, action] = useActionState<AdminFormState, FormData>(convidarUsuario, {});
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [colaboradorId, setColaboradorId] = useState("");

  function aoEscolherColaborador(id: string) {
    setColaboradorId(id);
    const c = colaboradores.find((x) => x.id === id);
    if (c) {
      setNome(c.nome);
      if (c.email) setEmail(c.email);
    }
  }

  // Após sucesso, mostra o link de convite e zera o formulário visualmente.
  if (state.ok && state.conviteUrl) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Usuário criado. Envie o link abaixo para a pessoa definir a senha:
        </p>
        <ConviteLink url={state.conviteUrl} />
        <Button variant="outline" size="sm" onClick={() => location.reload()}>
          Adicionar outro
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="colaboradorId" value={colaboradorId} />
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="colab">Colaborador (opcional)</Label>
        <select
          id="colab"
          value={colaboradorId}
          onChange={(e) => aoEscolherColaborador(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— Escolher de um colaborador cadastrado —</option>
          {colaboradores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}{c.funcao ? ` · ${c.funcao}` : ""}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">Preenche nome e e-mail automaticamente. Você também pode digitar manualmente.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" name="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail de acesso</Label>
        <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="perfilId">Perfil de acesso</Label>
        <select
          id="perfilId"
          name="perfilId"
          required
          defaultValue=""
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>Selecione um perfil…</option>
          {perfis.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      {state.error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <Enviar />
      </div>
    </form>
  );
}
