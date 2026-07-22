"use client";

import { createContext, useContext, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ArchiveRestore, Trash2, X, Loader2 } from "lucide-react";
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
  arquivarCadastrosEmLote,
  excluirCadastrosEmLote,
  type ResultadoLote,
} from "@/lib/cadastros/actions";

/**
 * Seleção múltipla nas listas de cadastro.
 *
 * A caixa de cada linha e a barra de ações moram em componentes diferentes,
 * então o estado da seleção fica neste contexto, que envolve os dois.
 *
 * Regra de segurança da tela: arquivar é reversível e aparece sempre; excluir
 * exige confirmação escrita e só aparece para quem pode excluir.
 */

type Ctx = {
  selecionados: Set<string>;
  alternar: (id: string) => void;
  marcarVarios: (ids: string[], marcar: boolean) => void;
  limpar: () => void;
};

const SelecaoCtx = createContext<Ctx | null>(null);

function useSelecao(): Ctx {
  const ctx = useContext(SelecaoCtx);
  if (!ctx) throw new Error("Use dentro de <SelecaoLote>.");
  return ctx;
}

/** Caixa de seleção de uma linha. */
export function CaixaLinha({ id, rotulo }: { id: string; rotulo: string }) {
  const { selecionados, alternar } = useSelecao();
  return (
    <input
      type="checkbox"
      className="size-4 cursor-pointer accent-[color:var(--brand-yellow)]"
      checked={selecionados.has(id)}
      onChange={() => alternar(id)}
      aria-label={`Selecionar ${rotulo}`}
    />
  );
}

/** Caixa do cabeçalho: marca ou desmarca tudo que está na página. */
export function CaixaTodos({ ids }: { ids: string[] }) {
  const { selecionados, marcarVarios } = useSelecao();
  const todos = ids.length > 0 && ids.every((i) => selecionados.has(i));
  return (
    <input
      type="checkbox"
      className="size-4 cursor-pointer accent-[color:var(--brand-yellow)]"
      checked={todos}
      onChange={() => marcarVarios(ids, !todos)}
      aria-label={todos ? "Desmarcar todos" : "Selecionar todos desta página"}
    />
  );
}

type Confirmacao = "arquivar" | "reativar" | "excluir" | null;

export function SelecaoLote({
  slug,
  rotulo,
  rotuloPlural,
  temSoftDelete,
  podeExcluir,
  children,
}: {
  slug: string;
  rotulo: string;
  rotuloPlural: string;
  temSoftDelete: boolean;
  podeExcluir: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmar, setConfirmar] = useState<Confirmacao>(null);
  const [resultado, setResultado] = useState<ResultadoLote | null>(null);
  const [rodando, iniciar] = useTransition();

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
      limpar: () => setSelecionados(new Set()),
    }),
    [selecionados],
  );

  const qtd = selecionados.size;
  const nomeQtd = `${qtd} ${qtd === 1 ? rotulo.toLowerCase() : rotuloPlural.toLowerCase()}`;

  function executar(acao: Exclude<Confirmacao, null>) {
    const ids = [...selecionados];
    iniciar(async () => {
      const r =
        acao === "excluir"
          ? await excluirCadastrosEmLote(slug, ids)
          : await arquivarCadastrosEmLote(slug, ids, acao === "arquivar");
      setResultado(r);
      setConfirmar(null);
      setSelecionados(new Set());
      router.refresh();
    });
  }

  const textos: Record<Exclude<Confirmacao, null>, { titulo: string; descricao: string; botao: string }> = {
    arquivar: {
      titulo: `Arquivar ${nomeQtd}?`,
      descricao: "Os registros saem das listas e dos seletores, mas o histórico é preservado. Dá para reativar depois.",
      botao: "Arquivar",
    },
    reativar: {
      titulo: `Reativar ${nomeQtd}?`,
      descricao: "Os registros voltam a aparecer nas listas e nos seletores.",
      botao: "Reativar",
    },
    excluir: {
      titulo: `Excluir ${nomeQtd} definitivamente?`,
      descricao:
        "Esta ação não pode ser desfeita. Quem tiver registro ligado (job, lançamento, proposta) não será excluído, e eu aviso quais ficaram.",
      botao: "Excluir definitivamente",
    },
  };

  return (
    <SelecaoCtx.Provider value={ctx}>
      {children}

      {/* Barra flutuante: só existe quando há seleção. */}
      {qtd > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 pl-4 shadow-lg">
            <span className="text-sm font-medium">{nomeQtd} selecionado{qtd === 1 ? "" : "s"}</span>
            <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
            {temSoftDelete && (
              <>
                <Button variant="outline" size="sm" onClick={() => setConfirmar("arquivar")} disabled={rodando}>
                  <Archive /> Arquivar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmar("reativar")} disabled={rodando}>
                  <ArchiveRestore /> Reativar
                </Button>
              </>
            )}
            {podeExcluir && (
              <Button variant="outline" size="sm" onClick={() => setConfirmar("excluir")} disabled={rodando}>
                <Trash2 /> Excluir
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={ctx.limpar} disabled={rodando}>
              <X /> Limpar
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmar !== null} onOpenChange={(v) => !v && setConfirmar(null)}>
        <DialogContent>
          {confirmar && (
            <>
              <DialogHeader>
                <DialogTitle>{textos[confirmar].titulo}</DialogTitle>
                <DialogDescription>{textos[confirmar].descricao}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmar(null)} disabled={rodando}>
                  Cancelar
                </Button>
                <Button
                  variant={confirmar === "excluir" ? "destructive" : "default"}
                  onClick={() => executar(confirmar)}
                  disabled={rodando}
                >
                  {rodando && <Loader2 className="animate-spin" />}
                  {textos[confirmar].botao}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={resultado !== null} onOpenChange={(v) => !v && setResultado(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resultado?.ok
                ? `${resultado.ok} ${resultado.ok === 1 ? "registro alterado" : "registros alterados"}`
                : "Nada foi alterado"}
            </DialogTitle>
            {resultado && resultado.falhas.length > 0 && (
              <DialogDescription>
                {resultado.falhas.length === 1 ? "Um registro ficou de fora:" : `${resultado.falhas.length} registros ficaram de fora:`}
              </DialogDescription>
            )}
          </DialogHeader>
          {resultado && resultado.falhas.length > 0 && (
            <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">
              {resultado.falhas.map((f, i) => (
                <li key={i} className="rounded-md bg-muted px-3 py-2">
                  <span className="font-medium">{f.nome}</span>
                  <span className="text-muted-foreground"> ({f.motivo})</span>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button onClick={() => setResultado(null)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SelecaoCtx.Provider>
  );
}
