"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send, Check, MessageSquareWarning, X, CalendarClock, BadgeCheck } from "lucide-react";
import {
  enviarParaAnalise,
  programarPagamento,
  marcarPago,
  pedirAjuste,
  aprovarReembolso,
  reprovarReembolso,
  type FormState,
} from "@/lib/reembolsos/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/shared/confirm-button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { ReembolsoStatus } from "@prisma/client";

function SubmitBtn({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Enviando…" : label}</Button>;
}

function BotaoAcao({
  action, label, icon, variant = "outline",
}: {
  action: () => Promise<unknown>;
  label: string;
  icon: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
}) {
  const [pendente, iniciar] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);
  function clicar() {
    setErro(null);
    iniciar(async () => {
      try { await action(); } catch (e) { if (!recarregarSeStale(e)) setErro(e instanceof Error ? e.message : "Erro."); }
    });
  }
  return (
    <span className="inline-flex flex-col">
      <Button type="button" size="sm" variant={variant} onClick={clicar} disabled={pendente}>{icon} {label}</Button>
      {erro && <span className="mt-1 text-xs text-destructive">{erro}</span>}
    </span>
  );
}

function EnviarDialog({
  action, titulo, descricao, label, icon, obrigatorio, variant = "outline",
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  titulo: string;
  descricao: string;
  label: string;
  icon: React.ReactNode;
  obrigatorio: boolean;
  variant?: "default" | "outline" | "ghost";
}) {
  const [aberto, setAberto] = React.useState(false);
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  React.useEffect(() => { if (state.ok) setAberto(false); }, [state]);

  return (
    <>
      <Button type="button" size="sm" variant={variant} onClick={() => setAberto(true)}>{icon} {label}</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <form action={formAction}>
            <DialogHeader>
              <DialogTitle>{titulo}</DialogTitle>
              <DialogDescription>{descricao}</DialogDescription>
            </DialogHeader>
            <div className="py-3">
              <Textarea name="parecer" rows={3} placeholder={obrigatorio ? "Descreva…" : "Observação (opcional)"} autoFocus />
              {state.error && <p className="mt-2 text-sm text-destructive">{state.error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
              <SubmitBtn label={label} />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ReembolsoAcoes({
  id, status, ehDono, ehFinanceiro,
}: {
  id: string;
  status: ReembolsoStatus;
  ehDono: boolean;
  ehFinanceiro: boolean;
}) {
  const enviar = enviarParaAnalise.bind(null, id);
  const programar = programarPagamento.bind(null, id);
  const pagar = marcarPago.bind(null, id);
  const ajuste = pedirAjuste.bind(null, id);
  const aprovar = aprovarReembolso.bind(null, id);
  const reprovar = reprovarReembolso.bind(null, id);

  const podeEnviar = ehDono && (status === "RASCUNHO" || status === "PENDENTE_AJUSTE");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {podeEnviar && (
        <BotaoAcao action={enviar} label="Enviar para análise" icon={<Send className="size-4" />} variant="default" />
      )}

      {ehFinanceiro && status === "ENVIADO" && (
        <>
          <EnviarDialog action={aprovar} titulo="Aprovar reembolso" descricao="As despesas aprovadas entrarão para pagamento." label="Aprovar" icon={<Check className="size-4" />} obrigatorio={false} variant="default" />
          <EnviarDialog action={ajuste} titulo="Pedir ajuste" descricao="O colaborador poderá corrigir e reenviar." label="Pedir ajuste" icon={<MessageSquareWarning className="size-4" />} obrigatorio />
          <EnviarDialog action={reprovar} titulo="Reprovar reembolso" descricao="Informe o motivo da reprovação." label="Reprovar" icon={<X className="size-4" />} obrigatorio />
        </>
      )}

      {ehFinanceiro && status === "PENDENTE_AJUSTE" && (
        <EnviarDialog action={reprovar} titulo="Reprovar reembolso" descricao="Informe o motivo da reprovação." label="Reprovar" icon={<X className="size-4" />} obrigatorio />
      )}

      {ehFinanceiro && status === "APROVADO" && (
        <ConfirmButton
          action={programar}
          titulo="Programar pagamento"
          descricao="Vamos gerar um lançamento de despesa no financeiro (vencimento no dia 20) e marcar o reembolso como programado."
          confirmarLabel="Programar"
          confirmVariant="default"
          triggerLabel="Programar pagamento"
          triggerIcon={<CalendarClock className="size-4" />}
          variant="default"
        />
      )}

      {ehFinanceiro && status === "PROGRAMADO" && (
        <ConfirmButton
          action={pagar}
          titulo="Marcar como pago"
          descricao="Confirma que o reembolso foi pago ao colaborador? O lançamento de despesa será quitado."
          confirmarLabel="Marcar como pago"
          confirmVariant="default"
          triggerLabel="Marcar como pago"
          triggerIcon={<BadgeCheck className="size-4" />}
          variant="default"
        />
      )}
    </div>
  );
}
