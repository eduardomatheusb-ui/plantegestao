"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { definirSenhaPorToken, type AdminFormState } from "@/lib/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Salvando…" : "Definir senha e acessar"}
    </Button>
  );
}

export function DefinirSenhaForm({ token }: { token: string }) {
  const [state, action] = useActionState<AdminFormState, FormData>(definirSenhaPorToken, {});

  if (state.ok) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-foreground">Senha definida com sucesso! Já pode entrar no sistema.</p>
        <Button asChild className="w-full">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-1.5">
        <Label htmlFor="senha">Nova senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="new-password" minLength={8} required />
        <p className="text-xs text-muted-foreground">Mínimo de 8 caracteres.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmar">Confirmar senha</Label>
        <Input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required />
      </div>
      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
      <Salvar />
    </form>
  );
}
