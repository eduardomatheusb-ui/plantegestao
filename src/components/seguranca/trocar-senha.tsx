"use client";

import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { alterarMinhaSenha, type SenhaState } from "@/app/(app)/configuracoes/seguranca/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Alterar senha"}</Button>;
}

export function TrocarSenha() {
  const [state, action] = useActionState<SenhaState, FormData>(alterarMinhaSenha, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" aria-hidden="true" /> {state.error}
        </p>
      )}
      {state.ok && (
        <p className="flex items-center gap-1.5 text-sm text-emerald-600">
          <CheckCircle2 className="size-4" aria-hidden="true" /> Senha alterada com sucesso.
        </p>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="atual">Senha atual</Label>
        <Input id="atual" name="atual" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nova">Nova senha</Label>
          <Input id="nova" name="nova" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirmar">Confirmar nova senha</Label>
          <Input id="confirmar" name="confirmar" type="password" autoComplete="new-password" required />
        </div>
      </div>
      <Salvar />
    </form>
  );
}
