"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Trash2 } from "lucide-react";
import { adicionarResultado, removerResultado } from "@/lib/trafego/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/utils";

type Resultado = {
  id: string; data: Date; investido: number; alcance: number;
  cliques: number; conversoes: number; leads: number; observacao: string | null;
};

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }).format(new Date(d));
}

function Adicionar() {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}><Plus className="size-4" /> {pending ? "Salvando…" : "Lançar"}</Button>;
}

export function ResultadosPanel({ campanhaId, resultados, podeEditar }: { campanhaId: string; resultados: Resultado[]; podeEditar: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="space-y-4">
      {podeEditar && (
        <form
          ref={formRef}
          action={async (fd) => { await adicionarResultado(campanhaId, fd); formRef.current?.reset(); }}
          className="grid grid-cols-2 gap-2 rounded-lg border border-border p-3 sm:grid-cols-7 sm:items-end"
        >
          <div className="space-y-1">
            <Label htmlFor="r-data" className="text-xs">Data</Label>
            <Input id="r-data" name="data" type="date" required className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-investido" className="text-xs">Investido</Label>
            <Input id="r-investido" name="investido" inputMode="decimal" placeholder="R$" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-alcance" className="text-xs">Alcance</Label>
            <Input id="r-alcance" name="alcance" inputMode="numeric" placeholder="0" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-cliques" className="text-xs">Cliques</Label>
            <Input id="r-cliques" name="cliques" inputMode="numeric" placeholder="0" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-conversoes" className="text-xs">Conversões</Label>
            <Input id="r-conversoes" name="conversoes" inputMode="numeric" placeholder="0" className="h-9" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="r-leads" className="text-xs">Leads</Label>
            <Input id="r-leads" name="leads" inputMode="numeric" placeholder="0" className="h-9" />
          </div>
          <Adicionar />
        </form>
      )}

      {resultados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum resultado lançado ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-2 font-medium">Data</th>
                <th className="py-2 pr-2 text-right font-medium">Investido</th>
                <th className="py-2 pr-2 text-right font-medium">Alcance</th>
                <th className="py-2 pr-2 text-right font-medium">Cliques</th>
                <th className="py-2 pr-2 text-right font-medium">Conversões</th>
                <th className="py-2 pr-2 text-right font-medium">Leads</th>
                {podeEditar && <th className="py-2" />}
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id} className="border-b border-border/60">
                  <td className="py-2 pr-2">{dataBR(r.data)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{formatBRL(r.investido)}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{r.alcance.toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{r.cliques.toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 text-right tabular-nums">{r.conversoes.toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-2 text-right tabular-nums font-medium">{r.leads.toLocaleString("pt-BR")}</td>
                  {podeEditar && (
                    <td className="py-2 text-right">
                      <form action={removerResultado.bind(null, r.id)}>
                        <button type="submit" aria-label="Remover" className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
