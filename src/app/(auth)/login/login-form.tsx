"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando…" : label}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState<LoginState, FormData>(loginAction, {});
  const precisa2fa = !!state.need2fa;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <h2 className="font-display text-2xl font-bold">{precisa2fa ? "Verificação em duas etapas" : "Entrar"}</h2>
        <p className="text-sm text-muted-foreground">
          {precisa2fa ? "Digite o código do seu app autenticador (ou um código de recuperação)." : "Acesse com seu e-mail e senha."}
        </p>
      </div>

      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      {/* E-mail e senha continuam no form (reenviados). Em 2FA, ficam só de leitura. */}
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="username" placeholder="voce@plante.com.br" required readOnly={precisa2fa} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input id="senha" name="senha" type="password" autoComplete="current-password" placeholder="Sua senha" required readOnly={precisa2fa} />
      </div>

      {precisa2fa && (
        <div className="space-y-2">
          <Label htmlFor="codigo">Código de verificação</Label>
          <Input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" autoFocus required />
        </div>
      )}

      <SubmitButton label={precisa2fa ? "Verificar" : "Entrar"} />

      {precisa2fa && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden="true" /> Senha confirmada — falta só o código.
        </p>
      )}
    </form>
  );
}
