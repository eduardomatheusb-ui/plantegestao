"use client";

import { useState, useTransition } from "react";
import { KeyRound, Power } from "lucide-react";
import {
  alterarPerfilUsuario,
  definirAtivoUsuario,
  reenviarConvite,
} from "@/lib/admin/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { ConviteLink } from "@/components/admin/convite-link";
import { recarregarSeStale } from "@/lib/stale-action";

type Perfil = { id: string; nome: string };

export function UsuarioAcoes({
  usuarioId,
  perfilIdAtual,
  perfis,
  ativo,
  convitePendente,
  ehProprio,
  responsavelConta,
}: {
  usuarioId: string;
  perfilIdAtual: string | null;
  perfis: Perfil[];
  ativo: boolean;
  convitePendente: boolean;
  ehProprio: boolean;
  responsavelConta: boolean;
}) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);

  function trocarPerfil(perfilId: string) {
    setErro(null);
    iniciar(async () => {
      try {
        await alterarPerfilUsuario(usuarioId, perfilId);
      } catch (e) {
        if (recarregarSeStale(e)) return;
        setErro(e instanceof Error ? e.message : "Não foi possível alterar o perfil.");
      }
    });
  }

  function gerarLink() {
    setErro(null);
    iniciar(async () => {
      const r = await reenviarConvite(usuarioId);
      if (r.error) setErro(r.error);
      else if (r.conviteUrl) setLinkUrl(r.conviteUrl);
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <select
        value={perfilIdAtual ?? ""}
        onChange={(e) => trocarPerfil(e.target.value)}
        disabled={pendente}
        aria-label="Perfil de acesso"
        className="h-8 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        {perfilIdAtual === null && <option value="">Sem perfil</option>}
        {perfis.map((p) => (
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>

      <Button type="button" variant="ghost" size="sm" onClick={gerarLink} disabled={pendente} title={convitePendente ? "Copiar link de convite" : "Gerar link para redefinir a senha"}>
        <KeyRound className="size-3.5" aria-hidden="true" />
        <span className="ml-1 hidden sm:inline">{convitePendente ? "Convite" : "Resetar senha"}</span>
      </Button>

      {ativo ? (
        !ehProprio && !responsavelConta ? (
          <ConfirmButton
            action={definirAtivoUsuario.bind(null, usuarioId, false)}
            titulo="Desativar este usuário?"
            descricao="A pessoa perde o acesso ao sistema imediatamente. Você pode reativar depois."
            confirmarLabel="Desativar"
            triggerLabel="Desativar"
            triggerIcon={<Power className="mr-1.5 size-3.5" aria-hidden="true" />}
          />
        ) : null
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pendente}
          onClick={() =>
            iniciar(async () => {
              try {
                await definirAtivoUsuario(usuarioId, true);
              } catch (e) {
                if (recarregarSeStale(e)) return;
                setErro(e instanceof Error ? e.message : "Não foi possível ativar.");
              }
            })
          }
        >
          <Power className="mr-1.5 size-3.5" aria-hidden="true" /> Ativar
        </Button>
      )}

      {erro && <p role="alert" className="w-full text-right text-xs text-destructive">{erro}</p>}

      <Dialog open={!!linkUrl} onOpenChange={(o) => !o && setLinkUrl(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link de acesso</DialogTitle>
            <DialogDescription>
              Envie este link para a pessoa definir a senha. Ele expira em 7 dias.
            </DialogDescription>
          </DialogHeader>
          {linkUrl && <ConviteLink url={linkUrl} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
