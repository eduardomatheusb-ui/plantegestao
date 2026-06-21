"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Botão que pede confirmação antes de executar uma ação sensível (LGPD/segurança).
 * `action` é uma server action (normalmente com .bind para passar o id).
 */
export function ConfirmButton({
  action,
  titulo,
  descricao,
  confirmarLabel = "Confirmar",
  cancelarLabel = "Cancelar",
  triggerLabel,
  triggerIcon,
  variant = "outline",
  confirmVariant = "destructive",
  size = "sm",
}: {
  action: () => Promise<unknown>;
  titulo: string;
  descricao: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  triggerLabel: React.ReactNode;
  triggerIcon?: React.ReactNode;
  variant?: ButtonProps["variant"];
  confirmVariant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) {
  const [aberto, setAberto] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);

  function confirmar() {
    setErro(null);
    iniciar(async () => {
      try {
        await action();
        setAberto(false);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
      }
    });
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <Button variant={variant} size={size} onClick={() => setAberto(true)}>
        {triggerIcon}
        {triggerLabel}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setAberto(false)} disabled={pendente}>
            {cancelarLabel}
          </Button>
          <Button variant={confirmVariant} onClick={confirmar} disabled={pendente}>
            {pendente ? "Processando…" : confirmarLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
