"use client";

import Link from "next/link";
import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ChevronDown } from "lucide-react";
import { salvarLancamento, type LancamentoFormState } from "@/lib/financeiro/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { LancamentoTipo } from "@prisma/client";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string };
type JobOpt = { id: string; numero: number; titulo: string };

export type LancamentoInicial = Partial<{
  titulo: string;
  sacadoId: string;
  categoriaId: string;
  dataVencimento: string;
  dataCompetencia: string;
  dataFaturamento: string;
  dataPagamento: string;
  valor: string;
  acrescimos: string;
  descontos: string;
  condicao: string;
  docNf: string;
  observacao: string;
  projetoId: string;
  jobId: string;
  centroCustoId: string;
  contaId: string;
  contaDestinoId: string;
  quitado: boolean;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Salvando…" : "Salvar lançamento"}</Button>;
}

export function LancamentoForm({
  id,
  tipo,
  inicial = {},
  sacados,
  sacadoLabel,
  categorias,
  centros,
  contas,
  projetos,
  jobs,
  cancelHref,
}: {
  id: string | null;
  tipo: LancamentoTipo;
  inicial?: LancamentoInicial;
  sacados: Opt[];
  sacadoLabel: string;
  categorias: Opt[];
  centros: Opt[];
  contas: Opt[];
  projetos: ProjetoOpt[];
  jobs: JobOpt[];
  cancelHref: string;
}) {
  const action = salvarLancamento.bind(null, id, tipo);
  const [state, formAction] = useActionState<LancamentoFormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];

  const isTransfer = tipo === "TRANSFERENCIA";
  const [completo, setCompleto] = React.useState(false);
  const [quitar, setQuitar] = React.useState(Boolean(inicial.quitado));

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título <span className="text-destructive">*</span></Label>
          <Input id="titulo" name="titulo" defaultValue={inicial.titulo ?? ""} aria-invalid={!!err("titulo")} required />
          {err("titulo") && <p className="text-xs text-destructive">{err("titulo")}</p>}
        </div>

        {isTransfer ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="contaId">Conta de origem <span className="text-destructive">*</span></Label>
              <select id="contaId" name="contaId" className={sel} defaultValue={inicial.contaId ?? ""}>
                <option value="">Selecione…</option>
                {contas.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
              {err("contaId") && <p className="text-xs text-destructive">{err("contaId")}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contaDestinoId">Conta de destino <span className="text-destructive">*</span></Label>
              <select id="contaDestinoId" name="contaDestinoId" className={sel} defaultValue={inicial.contaDestinoId ?? ""}>
                <option value="">Selecione…</option>
                {contas.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
              {err("contaDestinoId") && <p className="text-xs text-destructive">{err("contaDestinoId")}</p>}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="sacadoId">{sacadoLabel}</Label>
              <select id="sacadoId" name="sacadoId" className={sel} defaultValue={inicial.sacadoId ?? ""}>
                <option value="">— (nenhum)</option>
                {sacados.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoriaId">Categoria</Label>
              <select id="categoriaId" name="categoriaId" className={sel} defaultValue={inicial.categoriaId ?? ""}>
                <option value="">— (sem categoria)</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="dataVencimento">Vencimento <span className="text-destructive">*</span></Label>
          <Input id="dataVencimento" name="dataVencimento" type="date" defaultValue={inicial.dataVencimento ?? ""} aria-invalid={!!err("dataVencimento")} />
          {err("dataVencimento") && <p className="text-xs text-destructive">{err("dataVencimento")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataCompetencia">Competência <span className="text-destructive">*</span></Label>
          <Input id="dataCompetencia" name="dataCompetencia" type="date" defaultValue={inicial.dataCompetencia ?? ""} aria-invalid={!!err("dataCompetencia")} />
          {err("dataCompetencia") && <p className="text-xs text-destructive">{err("dataCompetencia")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="dataFaturamento">Faturamento</Label>
          <Input id="dataFaturamento" name="dataFaturamento" type="date" defaultValue={inicial.dataFaturamento ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="valor">Valor (R$) <span className="text-destructive">*</span></Label>
          <Input id="valor" name="valor" type="number" step="0.01" min="0" defaultValue={inicial.valor ?? ""} aria-invalid={!!err("valor")} />
          {err("valor") && <p className="text-xs text-destructive">{err("valor")}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="acrescimos">Acréscimos (R$)</Label>
          <Input id="acrescimos" name="acrescimos" type="number" step="0.01" min="0" defaultValue={inicial.acrescimos ?? "0"} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="descontos">Descontos (R$)</Label>
          <Input id="descontos" name="descontos" type="number" step="0.01" min="0" defaultValue={inicial.descontos ?? "0"} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condicao">Condição</Label>
          <select id="condicao" name="condicao" className={sel} defaultValue={inicial.condicao ?? "A_VISTA"}>
            <option value="A_VISTA">À vista</option>
            <option value="PARCELADO">Parcelado</option>
          </select>
        </div>
      </div>

      {/* Quitação */}
      <div className="space-y-3 rounded-md border border-border p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="quitarAgora" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} className="size-4 rounded border-input" />
          Marcar como quitado
        </label>
        {quitar && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="dataPagamento">Data de pagamento</Label>
            <Input id="dataPagamento" name="dataPagamento" type="date" defaultValue={inicial.dataPagamento ?? ""} />
          </div>
        )}
      </div>

      {/* Completo */}
      <button type="button" onClick={() => setCompleto((v) => !v)} className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ChevronDown className={`size-4 transition-transform ${completo ? "rotate-180" : ""}`} />
        {completo ? "Menos opções" : "Mais opções (completo)"}
      </button>

      {completo && (
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 rounded-md border border-border p-4 sm:grid-cols-2">
          {!isTransfer && (
            <div className="space-y-2">
              <Label htmlFor="contaId">Conta bancária</Label>
              <select id="contaId" name="contaId" className={sel} defaultValue={inicial.contaId ?? ""}>
                <option value="">— (nenhuma)</option>
                {contas.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="centroCustoId">Centro de custo</Label>
            <select id="centroCustoId" name="centroCustoId" className={sel} defaultValue={inicial.centroCustoId ?? ""}>
              <option value="">— (nenhum)</option>
              {centros.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="docNf">Documento / NF</Label>
            <Input id="docNf" name="docNf" defaultValue={inicial.docNf ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="projetoId">Relacionado ao projeto</Label>
            <select id="projetoId" name="projetoId" className={sel} defaultValue={inicial.projetoId ?? ""}>
              <option value="">— (nenhum)</option>
              {projetos.map((p) => (<option key={p.id} value={p.id}>#{p.numero} {p.nome}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobId">Relacionado ao job</Label>
            <select id="jobId" name="jobId" className={sel} defaultValue={inicial.jobId ?? ""}>
              <option value="">— (nenhum)</option>
              {jobs.map((j) => (<option key={j.id} value={j.id}>#{j.numero} {j.titulo}</option>))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea id="observacao" name="observacao" rows={3} defaultValue={inicial.observacao ?? ""} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Salvar />
        <Button asChild variant="outline"><Link href={cancelHref}>Cancelar</Link></Button>
      </div>
    </form>
  );
}
