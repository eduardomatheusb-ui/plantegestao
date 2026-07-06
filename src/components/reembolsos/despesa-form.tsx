"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";
import type { FormState } from "@/lib/reembolsos/actions";
import { CATEGORIAS, FORMAS_PAGAMENTO, LIMITE_AUTORIZACAO } from "@/lib/reembolsos/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Opt = { id: string; nome: string };
type ProjetoOpt = { id: string; numero: number; nome: string };
type JobOpt = { id: string; numero: number; titulo: string };

export type DespesaInicial = Partial<{
  data: string;
  categoria: string;
  descricao: string;
  valor: string;
  formaPagamento: string;
  clienteId: string;
  projetoId: string;
  jobId: string;
  centroCustoId: string;
  repassavelCliente: boolean;
  autorizadoPor: string;
}>;

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Salvar({ modo }: { modo: "add" | "edit" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Salvando…" : modo === "add" ? "Adicionar despesa" : "Salvar"}</Button>;
}

export function DespesaForm({
  action,
  opcoes,
  inicial = {},
  modo,
  onFechar,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  opcoes: { clientes: Opt[]; projetos: ProjetoOpt[]; jobs: JobOpt[]; centros: Opt[] };
  inicial?: DespesaInicial;
  modo: "add" | "edit";
  onFechar?: () => void;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});
  const err = (k: string) => state.fieldErrors?.[k];
  const formRef = React.useRef<HTMLFormElement>(null);
  const [valor, setValor] = React.useState(inicial.valor ?? "");
  const exigeAutorizacao = Number(valor.replace(",", ".") || "0") > LIMITE_AUTORIZACAO;

  React.useEffect(() => {
    if (state.ok) {
      if (modo === "add") { formRef.current?.reset(); setValor(""); }
      else onFechar?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2.5 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="space-y-1.5">
          <Label htmlFor="d-data">Data <span className="text-destructive">*</span></Label>
          <Input id="d-data" name="data" type="date" defaultValue={inicial.data ?? ""} aria-invalid={!!err("data")} />
          {err("data") && <p className="text-xs text-destructive">{err("data")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-categoria">Categoria <span className="text-destructive">*</span></Label>
          <select id="d-categoria" name="categoria" className={sel} defaultValue={inicial.categoria ?? ""} aria-invalid={!!err("categoria")}>
            <option value="">Selecione…</option>
            {CATEGORIAS.map((c) => (<option key={c.key} value={c.key}>{c.label}</option>))}
          </select>
          {err("categoria") && <p className="text-xs text-destructive">{err("categoria")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-valor">Valor (R$) <span className="text-destructive">*</span></Label>
          <Input id="d-valor" name="valor" type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} aria-invalid={!!err("valor")} />
          {err("valor") && <p className="text-xs text-destructive">{err("valor")}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-forma">Forma de pagamento</Label>
          <select id="d-forma" name="formaPagamento" className={sel} defaultValue={inicial.formaPagamento ?? ""}>
            <option value="">—</option>
            {FORMAS_PAGAMENTO.map((f) => (<option key={f.key} value={f.key}>{f.label}</option>))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="d-descricao">Descrição <span className="text-destructive">*</span></Label>
        <Input id="d-descricao" name="descricao" defaultValue={inicial.descricao ?? ""} placeholder="O que foi e por quê (ex.: Uber para gravação no cliente X)" aria-invalid={!!err("descricao")} />
        {err("descricao") && <p className="text-xs text-destructive">{err("descricao")}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="d-cliente">Cliente vinculado</Label>
          <select id="d-cliente" name="clienteId" className={sel} defaultValue={inicial.clienteId ?? ""}>
            <option value="">— (nenhum)</option>
            {opcoes.clientes.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-centro">Centro de custo</Label>
          <select id="d-centro" name="centroCustoId" className={sel} defaultValue={inicial.centroCustoId ?? ""}>
            <option value="">— (nenhum)</option>
            {opcoes.centros.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-projeto">Projeto</Label>
          <select id="d-projeto" name="projetoId" className={sel} defaultValue={inicial.projetoId ?? ""}>
            <option value="">— (nenhum)</option>
            {opcoes.projetos.map((p) => (<option key={p.id} value={p.id}>#{p.numero} {p.nome}</option>))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="d-job">Job</Label>
          <select id="d-job" name="jobId" className={sel} defaultValue={inicial.jobId ?? ""}>
            <option value="">— (nenhum)</option>
            {opcoes.jobs.map((j) => (<option key={j.id} value={j.id}>#{j.numero} {j.titulo}</option>))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="repassavelCliente" defaultChecked={inicial.repassavelCliente} className="size-4 rounded border-input" />
          Repassável ao cliente
        </label>
      </div>

      {exigeAutorizacao && (
        <div className="space-y-1.5 rounded-md border border-warning/40 bg-warning/10 p-2.5">
          <Label htmlFor="d-autorizado">Autorizado por <span className="text-destructive">*</span></Label>
          <Input id="d-autorizado" name="autorizadoPor" defaultValue={inicial.autorizadoPor ?? ""} placeholder="Nome de quem autorizou" aria-invalid={!!err("autorizadoPor")} />
          <p className="text-xs text-muted-foreground">Despesas acima de R$ {LIMITE_AUTORIZACAO} precisam de autorização prévia.</p>
          {err("autorizadoPor") && <p className="text-xs text-destructive">{err("autorizadoPor")}</p>}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Salvar modo={modo} />
        {modo === "edit" && <Button type="button" variant="ghost" size="sm" onClick={onFechar}>Cancelar</Button>}
      </div>
    </form>
  );
}
