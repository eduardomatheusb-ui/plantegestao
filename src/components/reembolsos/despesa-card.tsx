"use client";

import * as React from "react";
import { Pencil, Trash2, Check, X, Paperclip } from "lucide-react";
import { editarDespesa, excluirDespesa, avaliarDespesa, type FormState } from "@/lib/reembolsos/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { formatBRL } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmButton } from "@/components/shared/confirm-button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DespesaForm, type DespesaInicial } from "./despesa-form";

/** Diálogo estilizado para reprovar uma despesa com motivo (opcional). */
function ReprovarDespesaDialog({ despesaId }: { despesaId: string }) {
  const [aberto, setAberto] = React.useState(false);
  const [motivo, setMotivo] = React.useState("");
  const [pendente, iniciar] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);

  function confirmar() {
    setErro(null);
    iniciar(async () => {
      try {
        await avaliarDespesa(despesaId, false, motivo.trim() || undefined);
        setAberto(false);
        setMotivo("");
      } catch (e) {
        if (!recarregarSeStale(e)) setErro(e instanceof Error ? e.message : "Erro.");
      }
    });
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setAberto(true)} className="text-destructive hover:text-destructive"><X className="size-3.5" /> Reprovar</Button>
      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar despesa</DialogTitle>
            <DialogDescription>Ela não entra no total aprovado. O motivo aparece para o colaborador.</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Motivo (opcional)" autoFocus />
            {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={pendente}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmar} disabled={pendente}>{pendente ? "Reprovando…" : "Reprovar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string };
type JobOpt = { id: string; numero: number; titulo: string };

export type DespesaView = {
  id: string;
  dataISO: string;
  dataLabel: string;
  categoriaLabel: string;
  descricao: string;
  valor: number;
  formaLabel: string | null;
  clienteNome: string | null;
  projetoLabel: string | null;
  jobLabel: string | null;
  centroNome: string | null;
  repassavelCliente: boolean;
  autorizadoPor: string | null;
  aprovada: boolean | null;
  parecerItem: string | null;
  inicial: DespesaInicial;
};

export function DespesaCard({
  despesa,
  opcoes,
  podeEditar,
  podeAvaliar,
  comprovantes,
}: {
  despesa: DespesaView;
  opcoes: { clientes: Opt[]; projetos: ProjetoOpt[]; jobs: JobOpt[]; centros: Opt[] };
  podeEditar: boolean;
  podeAvaliar: boolean;
  comprovantes: React.ReactNode;
}) {
  const [editando, setEditando] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);

  const editarAction = React.useCallback(
    (prev: FormState, fd: FormData) => editarDespesa(despesa.id, prev, fd),
    [despesa.id],
  );

  function aprovar() {
    setErro(null);
    iniciar(async () => {
      try { await avaliarDespesa(despesa.id, true); } catch (e) { if (!recarregarSeStale(e)) setErro(e instanceof Error ? e.message : "Erro."); }
    });
  }

  if (editando) {
    return (
      <li className="rounded-lg border border-border bg-muted/30 p-4">
        <DespesaForm action={editarAction} opcoes={opcoes} inicial={despesa.inicial} modo="edit" onFechar={() => setEditando(false)} />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">{despesa.dataLabel}</span>
            <span className="text-muted-foreground">·</span>
            <span>{despesa.categoriaLabel}</span>
            {despesa.aprovada === true && <Badge variant="success">Aprovada</Badge>}
            {despesa.aprovada === false && <Badge variant="destructive">Reprovada</Badge>}
          </div>
          <p className="mt-1 break-words text-sm">{despesa.descricao}</p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {despesa.formaLabel && <span>{despesa.formaLabel}</span>}
            {despesa.clienteNome && <span>Cliente: {despesa.clienteNome}</span>}
            {despesa.projetoLabel && <span>{despesa.projetoLabel}</span>}
            {despesa.jobLabel && <span>{despesa.jobLabel}</span>}
            {despesa.centroNome && <span>CC: {despesa.centroNome}</span>}
            {despesa.repassavelCliente && <span className="font-medium text-foreground">Repassável ao cliente</span>}
            {despesa.autorizadoPor && <span>Autorizado por: {despesa.autorizadoPor}</span>}
          </div>
          {despesa.aprovada === false && despesa.parecerItem && (
            <p className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive">Motivo: {despesa.parecerItem}</p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular-nums font-semibold">{formatBRL(despesa.valor)}</p>
        </div>
      </div>

      {/* Comprovantes */}
      <div className="mt-3 border-t border-border pt-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <Paperclip className="size-3.5" /> Comprovante
        </p>
        {comprovantes}
      </div>

      {erro && <p className="mt-2 text-xs text-destructive">{erro}</p>}

      {(podeEditar || podeAvaliar) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {podeEditar && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditando(true)}><Pencil className="size-3.5" /> Editar</Button>
              <ConfirmButton
                action={excluirDespesa.bind(null, despesa.id)}
                titulo="Excluir despesa"
                descricao="A despesa e seu comprovante serão removidos deste pedido."
                confirmarLabel="Excluir"
                triggerLabel="Excluir"
                triggerIcon={<Trash2 className="size-3.5" />}
                variant="ghost"
              />
            </>
          )}
          {podeAvaliar && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={aprovar} disabled={pendente}><Check className="size-3.5" /> Aprovar</Button>
              <ReprovarDespesaDialog despesaId={despesa.id} />
            </>
          )}
        </div>
      )}
    </li>
  );
}
