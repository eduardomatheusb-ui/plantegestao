"use client";

import * as React from "react";
import { useActionState } from "react";
import { ShieldCheck, ShieldOff, Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { iniciarTotp, confirmarTotp, desativarTotp, type TotpState } from "@/app/(app)/configuracoes/seguranca/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function Erro({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" /> {msg}
    </p>
  );
}

function Recovery({ codigos }: { codigos: string[] }) {
  const [copiado, setCopiado] = React.useState(false);
  return (
    <div className="space-y-3 rounded-md border border-brand-yellow bg-brand-yellow/10 p-4">
      <p className="text-sm font-semibold">Guarde seus códigos de recuperação</p>
      <p className="text-xs text-muted-foreground">
        Use um deles para entrar caso perca o celular. Cada código funciona <strong>uma vez</strong>.
        Eles não serão mostrados de novo.
      </p>
      <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
        {codigos.map((c) => (<li key={c} className="rounded bg-background px-2 py-1 text-center">{c}</li>))}
      </ul>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { navigator.clipboard?.writeText(codigos.join("\n")); setCopiado(true); }}
      >
        {copiado ? <Check className="size-4" /> : <Copy className="size-4" />} {copiado ? "Copiado" : "Copiar códigos"}
      </Button>
    </div>
  );
}

export function DoisFatores({ ativo }: { ativo: boolean }) {
  const [qr, setQr] = React.useState<string | null>(null);
  const [iniciando, setIniciando] = React.useState(false);
  const [confState, confirmar] = useActionState<TotpState, FormData>(confirmarTotp, {});
  const [desState, desativar] = useActionState<TotpState, FormData>(desativarTotp, {});

  // 2FA já ativo → opção de desativar.
  if (ativo && !desState.ok) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <ShieldCheck className="size-5" /> Verificação em duas etapas está <strong>ativa</strong>.
        </p>
        <form action={desativar} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Para desativar, digite um código do app</Label>
            <Input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-40" />
          </div>
          <Button type="submit" variant="outline"><ShieldOff className="size-4" /> Desativar 2FA</Button>
        </form>
        <Erro msg={desState.error} />
      </div>
    );
  }
  if (desState.ok) {
    return <p className="text-sm text-muted-foreground">2FA desativado. Recarregue a página para reativar se quiser.</p>;
  }

  // Códigos de recuperação após ativar.
  if (confState.ok && confState.codigos) {
    return (
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm font-medium text-success">
          <ShieldCheck className="size-5" /> 2FA ativado! 🎉
        </p>
        <Recovery codigos={confState.codigos} />
      </div>
    );
  }

  // Passo de escanear o QR.
  if (qr) {
    return (
      <div className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Abra um app autenticador (Google Authenticator, Authy, Microsoft Authenticator…).</li>
          <li>Escaneie o QR code abaixo.</li>
          <li>Digite o código de 6 dígitos que aparecer.</li>
        </ol>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} alt="QR code do 2FA" className="size-44 rounded-md border border-border bg-white p-2" />
        <form action={confirmar} className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código do app</Label>
            <Input id="codigo" name="codigo" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="w-40" required />
          </div>
          <Button type="submit"><ShieldCheck className="size-4" /> Confirmar e ativar</Button>
        </form>
        <Erro msg={confState.error} />
      </div>
    );
  }

  // Início: botão para ativar.
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Adicione uma camada extra de segurança: além da senha, será pedido um código do seu celular ao entrar.
      </p>
      <Button
        disabled={iniciando}
        onClick={async () => { setIniciando(true); const r = await iniciarTotp(); setQr(r.qr ?? null); setIniciando(false); }}
      >
        {iniciando ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Ativar 2FA
      </Button>
    </div>
  );
}
