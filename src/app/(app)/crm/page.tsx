import Link from "next/link";
import { Plus } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarLeads } from "@/lib/crm/queries";
import { ETAPAS_LEAD } from "@/lib/crm/etapas";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { MoverEtapa } from "@/components/crm/mover-etapa";
import { formatBRL } from "@/lib/utils";

export default async function CrmPage() {
  await requireModulo("propostas", "VER");
  const leads = await listarLeads();

  const colunas = ETAPAS_LEAD.map((e) => {
    const itens = leads.filter((l) => l.etapa === e.key);
    const total = itens.reduce((s, l) => s + (l.valorEstimado ?? 0), 0);
    return { ...e, itens, total };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="CRM — Funil comercial"
        descricao="Leads e oportunidades, da prospecção ao fechamento."
        acao={<Button asChild><Link href="/crm/novo"><Plus className="size-4" /> Novo lead</Link></Button>}
      />

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum lead ainda. Crie o primeiro com &quot;Novo lead&quot;.</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {colunas.map((col) => (
            <section key={col.key} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 p-2">
              <header className="flex items-center justify-between px-1 py-2">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: col.cor }} aria-hidden="true" />
                  {col.label}
                </span>
                <span className="rounded-full bg-background px-2 text-xs font-medium text-muted-foreground tabular-nums">{col.itens.length}</span>
              </header>
              {col.total > 0 && <p className="px-1 pb-2 text-xs text-muted-foreground">{formatBRL(col.total)}</p>}
              <div className="flex-1 space-y-2">
                {col.itens.length === 0 ? (
                  <p className="px-1 py-3 text-xs text-muted-foreground">Vazio</p>
                ) : (
                  col.itens.map((l) => (
                    <div key={l.id} className="space-y-2 rounded-lg border border-border bg-card p-3 shadow-sm">
                      <Link href={`/crm/${l.id}`} className="block hover:underline">
                        <p className="text-sm font-medium leading-tight">{l.nome}</p>
                        {l.empresa && <p className="truncate text-xs text-muted-foreground">{l.empresa}</p>}
                      </Link>
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">{l.valorEstimado ? formatBRL(l.valorEstimado) : "—"}</span>
                        {l.responsavel && <span className="truncate">{l.responsavel.nome}</span>}
                      </div>
                      <MoverEtapa id={l.id} etapa={l.etapa} />
                    </div>
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
