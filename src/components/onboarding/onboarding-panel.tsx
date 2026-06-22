"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, Plus, Trash2, ChevronDown, Rocket, PartyPopper } from "lucide-react";
import {
  iniciarOnboarding, toggleOnboardingItem, atualizarOnboardingItem,
  adicionarOnboardingItem, removerOnboardingItem,
} from "@/lib/onboarding/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Usuario = { id: string; nome: string };
type Item = {
  id: string; titulo: string; concluido: boolean;
  responsavelId: string | null; observacao: string | null;
  responsavel: { id: string; nome: string } | null;
};

const sel = "h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function OnboardingPanel({
  clienteId, status, itens, usuarios,
}: {
  clienteId: string;
  status: string;
  itens: Item[];
  usuarios: Usuario[];
}) {
  const [pendente, iniciar] = useTransition();
  const [aberto, setAberto] = useState<string | null>(null);
  const [novoItem, setNovoItem] = useState("");

  const total = itens.length;
  const feitos = itens.filter((i) => i.concluido).length;
  const pct = total ? Math.round((feitos / total) * 100) : 0;
  const completo = total > 0 && feitos === total;

  function rodar(fn: () => Promise<unknown>) {
    iniciar(async () => {
      try { await fn(); } catch (e) { if (!recarregarSeStale(e)) console.error(e); }
    });
  }

  if (total === 0) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          {status === "implantacao"
            ? "Este cliente está em implantação. Crie o checklist padrão de onboarding para acompanhar a entrada dele."
            : "Sem checklist de onboarding. Você pode criar um para padronizar a entrada deste cliente."}
        </p>
        <Button type="button" size="sm" disabled={pendente} onClick={() => rodar(() => iniciarOnboarding(clienteId))}>
          <Rocket className="size-4" /> Iniciar checklist de onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progresso */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{feitos} de {total} concluídos</span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {completo && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          <PartyPopper className="size-4 shrink-0" aria-hidden="true" />
          <span>Checklist completo!{status === "ativo" ? " O cliente foi ativado automaticamente." : ""}</span>
        </div>
      )}

      {/* Itens */}
      <ul className="divide-y divide-border rounded-lg border border-border">
        {itens.map((item) => {
          const expandido = aberto === item.id;
          return (
            <li key={item.id} className="p-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  aria-label={item.concluido ? "Reabrir item" : "Concluir item"}
                  disabled={pendente}
                  onClick={() => rodar(() => toggleOnboardingItem(item.id))}
                  className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                >
                  {item.concluido
                    ? <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
                    : <Circle className="size-5" aria-hidden="true" />}
                </button>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${item.concluido ? "text-muted-foreground line-through" : "font-medium"}`}>{item.titulo}</p>
                  {(item.responsavel || item.observacao) && !expandido && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.responsavel ? item.responsavel.nome : "Sem responsável"}
                      {item.observacao ? ` · ${item.observacao}` : ""}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Detalhes do item"
                  onClick={() => setAberto(expandido ? null : item.id)}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ChevronDown className={`size-4 transition-transform ${expandido ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </div>

              {expandido && (
                <form
                  action={atualizarOnboardingItem.bind(null, item.id)}
                  className="mt-3 space-y-2 border-t border-border pt-3"
                >
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <select name="responsavelId" defaultValue={item.responsavelId ?? ""} className={sel} aria-label="Responsável">
                      <option value="">Sem responsável</option>
                      {usuarios.map((u) => (<option key={u.id} value={u.id}>{u.nome}</option>))}
                    </select>
                    <Input name="observacao" defaultValue={item.observacao ?? ""} placeholder="Observação" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Button type="submit" size="sm" variant="outline">Salvar</Button>
                    <Button type="button" size="sm" variant="ghost" disabled={pendente} onClick={() => rodar(() => removerOnboardingItem(item.id))}>
                      <Trash2 className="size-4" /> Remover
                    </Button>
                  </div>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {/* Adicionar item */}
      <form
        action={(fd) => { rodar(() => adicionarOnboardingItem(clienteId, fd)); setNovoItem(""); }}
        className="flex items-center gap-2"
      >
        <Input name="titulo" value={novoItem} onChange={(e) => setNovoItem(e.target.value)} placeholder="Adicionar etapa…" />
        <Button type="submit" size="sm" variant="outline" disabled={pendente || !novoItem.trim()}><Plus className="size-4" /> Adicionar</Button>
      </form>
    </div>
  );
}
