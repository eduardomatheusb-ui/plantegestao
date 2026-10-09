"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, ArrowRightLeft, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { moverJobsStatusEmLote, type ResultadoLoteJobs } from "@/lib/jobs/actions";

type StatusOpt = { id: string; nome: string; isConcluido: boolean };

/**
 * Barra de ações em lote da lista de jobs (aparece quando há seleção).
 * A seleção em si vive na JobsTable, que passa os ids marcados.
 */
export function BarraLoteJobs({
  selecionados,
  limpar,
  statuses,
  podeRegularizar,
}: {
  selecionados: string[];
  limpar: () => void;
  statuses: StatusOpt[];
  podeRegularizar: boolean;
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"concluir" | "mover" | null>(null);
  const [destino, setDestino] = useState("");
  const [regularizar, setRegularizar] = useState(false);
  const [resultado, setResultado] = useState<ResultadoLoteJobs | null>(null);
  const [erro, setErro] = useState("");
  const [rodando, iniciar] = useTransition();

  const qtd = selecionados.length;
  const statusConcluido = statuses.find((s) => s.isConcluido);
  const plural = qtd === 1 ? "" : "s";

  function executar(statusId: string, comRegularizacao: boolean) {
    const ids = [...selecionados];
    setErro("");
    iniciar(async () => {
      try {
        const r = await moverJobsStatusEmLote(ids, statusId, { regularizar: comRegularizacao });
        setModal(null);
        setResultado(r);
        limpar();
        router.refresh();
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não foi possível concluir a ação.");
      }
    });
  }

  if (qtd === 0 && !resultado) return null;

  return (
    <>
      {qtd > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 pl-4 shadow-lg">
            <span className="text-sm font-medium">{qtd} job{plural} selecionado{plural}</span>
            <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            {statusConcluido && (
              <Button variant="outline" size="sm" onClick={() => { setRegularizar(false); setErro(""); setModal("concluir"); }} disabled={rodando}>
                <CheckCheck /> Concluir
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => { setDestino(""); setErro(""); setModal("mover"); }} disabled={rodando}>
              <ArrowRightLeft /> Mudar status
            </Button>
            <Button variant="ghost" size="sm" onClick={limpar} disabled={rodando}>
              <X /> Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Concluir */}
      <Dialog open={modal === "concluir"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir {qtd} job{plural}?</DialogTitle>
            <DialogDescription>
              Vão para &quot;{statusConcluido?.nome}&quot;. A conclusão fica com a data de hoje e, se o prazo já passou,
              o job conta como concluído fora do prazo.
            </DialogDescription>
          </DialogHeader>
          {podeRegularizar && (
            <label className="flex items-start gap-3 rounded-md border border-border p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-[color:var(--brand-yellow)]"
                checked={regularizar}
                onChange={(e) => setRegularizar(e.target.checked)}
              />
              <span>
                <span className="font-medium">São jobs já entregues que ninguém marcou</span>
                <span className="block text-muted-foreground">
                  A conclusão fica na data do prazo (ou da postagem) e não conta como atraso. Fica registrado no
                  histórico de cada job como regularização.
                </span>
              </span>
            </label>
          )}
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={rodando}>Cancelar</Button>
            <Button onClick={() => statusConcluido && executar(statusConcluido.id, regularizar)} disabled={rodando}>
              {rodando && <Loader2 className="animate-spin" />} Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mudar status */}
      <Dialog open={modal === "mover"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mudar o status de {qtd} job{plural}</DialogTitle>
            <DialogDescription>Todos os selecionados vão para o mesmo status.</DialogDescription>
          </DialogHeader>
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            aria-label="Novo status"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Escolha o status</option>
            {statuses.map((s) => (<option key={s.id} value={s.id}>{s.nome}</option>))}
          </select>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={rodando}>Cancelar</Button>
            <Button onClick={() => destino && executar(destino, false)} disabled={rodando || !destino}>
              {rodando && <Loader2 className="animate-spin" />} Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resultado */}
      <Dialog open={resultado !== null} onOpenChange={(v) => !v && setResultado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resultado?.ok ? `${resultado.ok} job${resultado.ok === 1 ? "" : "s"} atualizado${resultado.ok === 1 ? "" : "s"}` : "Nada foi alterado"}
            </DialogTitle>
            {resultado && resultado.ignorados > 0 && (
              <DialogDescription>
                {resultado.ignorados} já estava{resultado.ignorados === 1 ? "" : "m"} nesse status.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResultado(null)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
