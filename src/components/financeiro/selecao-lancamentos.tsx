"use client";

import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Trash2, Tag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  quitarLancamentosEmLote,
  excluirLancamentosEmLote,
  reclassificarLancamentosEmLote,
  type ResultadoLoteFin,
} from "@/lib/financeiro/actions";

/**
 * Seleção múltipla na tela de lançamentos.
 *
 * A tabela do financeiro é própria (não usa o DataTable genérico), então este
 * componente só cuida do estado da seleção e da barra de ações. As caixas de
 * cada linha ficam em CaixaLancamento, dentro das linhas que a página monta.
 */

type Opcao = { id: string; nome: string };

type Ctx = {
  selecionados: Set<string>;
  alternar: (id: string) => void;
  marcarVarios: (ids: string[], marcar: boolean) => void;
};

const Ctx = createContext<Ctx | null>(null);

function useCtx(): Ctx {
  const c = useContext(Ctx);
  if (!c) throw new Error("Use dentro de <SelecaoLancamentos>.");
  return c;
}

export function CaixaLancamento({ id, titulo }: { id: string; titulo: string }) {
  const { selecionados, alternar } = useCtx();
  return (
    <input
      type="checkbox"
      className="size-4 cursor-pointer accent-[color:var(--brand-yellow)]"
      checked={selecionados.has(id)}
      onChange={() => alternar(id)}
      aria-label={`Selecionar ${titulo}`}
    />
  );
}

export function CaixaTodosLancamentos({ ids }: { ids: string[] }) {
  const { selecionados, marcarVarios } = useCtx();
  const todos = ids.length > 0 && ids.every((i) => selecionados.has(i));
  return (
    <input
      type="checkbox"
      className="size-4 cursor-pointer accent-[color:var(--brand-yellow)]"
      checked={todos}
      onChange={() => marcarVarios(ids, !todos)}
      aria-label={todos ? "Desmarcar todos" : "Selecionar todos deste mês"}
    />
  );
}

type Modal = "quitar" | "excluir" | "reclassificar" | null;

export function SelecaoLancamentos({
  podeExcluir,
  categorias,
  centrosCusto,
  children,
}: {
  podeExcluir: boolean;
  categorias: Opcao[];
  centrosCusto: Opcao[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<Modal>(null);
  const [resultado, setResultado] = useState<(ResultadoLoteFin & { rotulo: string }) | null>(null);
  const [rodando, iniciar] = useTransition();

  // Estado do diálogo de reclassificar.
  const [campo, setCampo] = useState<"categoriaId" | "centroCustoId">("categoriaId");
  const [valorId, setValorId] = useState<string>("");

  const ctx = useMemo<Ctx>(
    () => ({
      selecionados,
      alternar: (id) =>
        setSelecionados((s) => {
          const n = new Set(s);
          if (n.has(id)) n.delete(id);
          else n.add(id);
          return n;
        }),
      marcarVarios: (ids, marcar) =>
        setSelecionados((s) => {
          const n = new Set(s);
          for (const id of ids) {
            if (marcar) n.add(id);
            else n.delete(id);
          }
          return n;
        }),
    }),
    [selecionados],
  );

  const qtd = selecionados.size;

  function fecharTudo() {
    setModal(null);
    setSelecionados(new Set());
    router.refresh();
  }

  function quitar() {
    const ids = [...selecionados];
    iniciar(async () => {
      const r = await quitarLancamentosEmLote(ids);
      setResultado({ ...r, rotulo: "quitado" });
      fecharTudo();
    });
  }

  function excluir() {
    const ids = [...selecionados];
    iniciar(async () => {
      const r = await excluirLancamentosEmLote(ids);
      setResultado({ ...r, rotulo: "excluído" });
      fecharTudo();
    });
  }

  function reclassificar() {
    const ids = [...selecionados];
    const c = campo;
    const v = valorId || null;
    iniciar(async () => {
      const r = await reclassificarLancamentosEmLote(ids, c, v);
      setResultado({ ...r, rotulo: "atualizado" });
      fecharTudo();
    });
  }

  const opcoes = campo === "categoriaId" ? categorias : centrosCusto;

  return (
    <Ctx.Provider value={ctx}>
      {children}

      {qtd > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 pl-4 shadow-lg">
            <span className="text-sm font-medium">
              {qtd} lançamento{qtd === 1 ? "" : "s"} selecionado{qtd === 1 ? "" : "s"}
            </span>
            <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            <Button variant="outline" size="sm" onClick={() => setModal("quitar")} disabled={rodando}>
              <Check /> Marcar pago
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setValorId(""); setModal("reclassificar"); }} disabled={rodando}>
              <Tag /> Categoria / centro
            </Button>
            {podeExcluir && (
              <Button variant="outline" size="sm" onClick={() => setModal("excluir")} disabled={rodando}>
                <Trash2 /> Excluir
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setSelecionados(new Set())} disabled={rodando}>
              <X /> Limpar
            </Button>
          </div>
        </div>
      )}

      {/* Quitar */}
      <Dialog open={modal === "quitar"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marcar {qtd} lançamento{qtd === 1 ? "" : "s"} como pago?</DialogTitle>
            <DialogDescription>
              A data de pagamento fica como hoje. Transferências e o que já está quitado são ignorados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={rodando}>Cancelar</Button>
            <Button onClick={quitar} disabled={rodando}>
              {rodando && <Loader2 className="animate-spin" />} Marcar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reclassificar */}
      <Dialog open={modal === "reclassificar"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar a {qtd} lançamento{qtd === 1 ? "" : "s"}</DialogTitle>
            <DialogDescription>O mesmo valor é aplicado a todos os selecionados.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={campo === "categoriaId" ? "default" : "outline"}
                size="sm"
                onClick={() => { setCampo("categoriaId"); setValorId(""); }}
              >
                Categoria
              </Button>
              <Button
                type="button"
                variant={campo === "centroCustoId" ? "default" : "outline"}
                size="sm"
                onClick={() => { setCampo("centroCustoId"); setValorId(""); }}
              >
                Centro de custo
              </Button>
            </div>
            <select
              value={valorId}
              onChange={(e) => setValorId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">(deixar em branco)</option>
              {opcoes.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={rodando}>Cancelar</Button>
            <Button onClick={reclassificar} disabled={rodando}>
              {rodando && <Loader2 className="animate-spin" />} Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir */}
      <Dialog open={modal === "excluir"} onOpenChange={(v) => !v && setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir {qtd} lançamento{qtd === 1 ? "" : "s"} definitivamente?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Se algum tiver vínculo e não puder ser excluído, eu aviso quantos ficaram.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)} disabled={rodando}>Cancelar</Button>
            <Button variant="destructive" onClick={excluir} disabled={rodando}>
              {rodando && <Loader2 className="animate-spin" />} Excluir definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resultado */}
      <Dialog open={resultado !== null} onOpenChange={(v) => !v && setResultado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resultado?.ok
                ? `${resultado.ok} lançamento${resultado.ok === 1 ? "" : "s"} ${resultado.rotulo}${resultado.ok === 1 ? "" : "s"}`
                : "Nada foi alterado"}
            </DialogTitle>
            {resultado && (resultado.ignorados > 0 || resultado.falhas > 0) && (
              <DialogDescription>
                {resultado.ignorados > 0 && `${resultado.ignorados} ignorado${resultado.ignorados === 1 ? "" : "s"} (já estavam pagos ou eram transferência). `}
                {resultado.falhas > 0 && `${resultado.falhas} não pôde ser excluído por ter vínculo.`}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setResultado(null)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
