"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { salvarPerfil, type AdminFormState } from "@/lib/admin/actions";
import { MODULOS, NIVEL_LABEL, type Capacidades } from "@/lib/permissoes";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const NIVEIS = ["NENHUM", "VER", "EDITAR", "ADMIN"] as const;

function Salvar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Salvando…" : "Salvar perfil"}
    </Button>
  );
}

export function PerfilForm({
  id,
  inicial,
}: {
  id: string | null;
  inicial: { nome: string; descricao: string | null; caps: Capacidades };
}) {
  const router = useRouter();
  const [state, action] = useActionState<AdminFormState, FormData>(salvarPerfil.bind(null, id), {});

  useEffect(() => {
    if (state.ok) router.push("/configuracoes/perfis");
  }, [state.ok, router]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome do perfil</Label>
          <Input id="nome" name="nome" defaultValue={inicial.nome} placeholder="Ex.: Audiovisual" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="descricao">Descrição</Label>
          <Input id="descricao" name="descricao" defaultValue={inicial.descricao ?? ""} placeholder="Para que serve este perfil" />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Permissões por módulo</p>
        <div className="overflow-hidden rounded-lg border border-border">
          {MODULOS.map((m, i) => (
            <div
              key={m.key}
              className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i % 2 ? "bg-muted/30" : ""}`}
            >
              <Label htmlFor={`nivel_${m.key}`} className="text-sm">{m.label}</Label>
              <select
                id={`nivel_${m.key}`}
                name={`nivel_${m.key}`}
                defaultValue={inicial.caps[m.key]}
                className="h-9 w-40 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>{NIVEL_LABEL[n]}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          <strong>Administração</strong> em &quot;Administrar&quot; permite gerenciar usuários, perfis e empresa.
        </p>
      </div>

      {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}

      <div className="flex gap-3">
        <Salvar />
        <Button type="button" variant="ghost" onClick={() => router.push("/configuracoes/perfis")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
