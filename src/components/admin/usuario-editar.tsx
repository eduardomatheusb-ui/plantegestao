"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, AlertCircle, CheckCircle2 } from "lucide-react";
import { editarUsuario, definirSenhaUsuario, vincularColaborador, type AdminFormState } from "@/lib/admin/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

type Colab = { id: string; nome: string; funcao: string | null; usuarioId: string | null };

const sel = "h-10 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Salvando…" : label}</Button>;
}

function Feedback({ state }: { state: AdminFormState }) {
  if (state.error) return <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive"><AlertCircle className="size-4" /> {state.error}</p>;
  if (state.ok) return <p className="flex items-center gap-1.5 text-sm text-emerald-600"><CheckCircle2 className="size-4" /> Salvo.</p>;
  return null;
}

export function UsuarioEditar({
  usuarioId, nome, email, colaboradorId, colaboradores,
}: {
  usuarioId: string;
  nome: string;
  email: string;
  colaboradorId: string | null;
  colaboradores: Colab[];
}) {
  const [aberto, setAberto] = useState(false);
  const [dadosState, salvarDados] = useActionState<AdminFormState, FormData>(editarUsuario.bind(null, usuarioId), {});
  const [senhaState, salvarSenha] = useActionState<AdminFormState, FormData>(definirSenhaUsuario.bind(null, usuarioId), {});
  const [vincPendente, iniciarVinc] = useTransition();
  const [vinculo, setVinculo] = useState(colaboradorId ?? "");

  // Opções: colaboradores livres + o já ligado a este usuário.
  const opcoes = colaboradores.filter((c) => !c.usuarioId || c.id === colaboradorId);

  function mudarVinculo(novo: string) {
    setVinculo(novo);
    iniciarVinc(async () => {
      try { await vincularColaborador(usuarioId, novo || null); }
      catch (e) { if (!recarregarSeStale(e)) setVinculo(colaboradorId ?? ""); }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Pencil className="size-3.5" aria-hidden="true" /> <span className="ml-1 hidden sm:inline">Editar</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Dados de acesso, senha e vínculo com o colaborador.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Dados */}
          <form action={salvarDados} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`nome-${usuarioId}`}>Nome</Label>
              <Input id={`nome-${usuarioId}`} name="nome" defaultValue={nome} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`email-${usuarioId}`}>E-mail (login)</Label>
              <Input id={`email-${usuarioId}`} name="email" type="email" defaultValue={email} required />
            </div>
            <div className="flex items-center justify-between">
              <Salvar label="Salvar dados" />
              <Feedback state={dadosState} />
            </div>
          </form>

          <hr className="border-border" />

          {/* Vínculo com colaborador */}
          <div className="space-y-1.5">
            <Label htmlFor={`colab-${usuarioId}`}>Colaborador vinculado</Label>
            <select id={`colab-${usuarioId}`} className={sel} value={vinculo} disabled={vincPendente} onChange={(e) => mudarVinculo(e.target.value)}>
              <option value="">— Sem vínculo</option>
              {opcoes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}{c.funcao ? ` · ${c.funcao}` : ""}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">Vincula o login a um colaborador do cadastro (usado em função, salário etc.).</p>
          </div>

          <hr className="border-border" />

          {/* Senha */}
          <form action={salvarSenha} className="space-y-3">
            <p className="text-sm font-medium">Definir nova senha</p>
            <div className="space-y-1.5">
              <Label htmlFor={`senha-${usuarioId}`}>Nova senha</Label>
              <Input id={`senha-${usuarioId}`} name="senha" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`conf-${usuarioId}`}>Confirmar senha</Label>
              <Input id={`conf-${usuarioId}`} name="confirmar" type="password" autoComplete="new-password" />
            </div>
            <div className="flex items-center justify-between">
              <Salvar label="Definir senha" />
              <Feedback state={senhaState} />
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
