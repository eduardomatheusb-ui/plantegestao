import Link from "next/link";
import { Plus, Repeat } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarContratos, resumoMrr } from "@/lib/contratos/queries";
import { rotuloContratoStatus, corContratoStatus } from "@/lib/contratos/constantes";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export default async function ContratosPage() {
  await requireModulo("financeiro", "VER");
  const [contratos, mrr] = await Promise.all([listarContratos(), resumoMrr()]);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Contratos"
        descricao="Contratos recorrentes (fee mensal) e receita previsível."
        acao={<Button asChild><Link href="/contratos/novo"><Plus className="size-4" /> Novo contrato</Link></Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">MRR (receita mensal recorrente)</p><p className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-600">{formatBRL(mrr.mrr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">ARR (anual)</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{formatBRL(mrr.arr)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Contratos ativos</p><p className="mt-0.5 text-2xl font-bold tabular-nums">{mrr.contratosAtivos}</p></CardContent></Card>
      </div>

      {contratos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum contrato ainda. Cadastre o primeiro com &quot;Novo contrato&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contratos.map((c) => (
            <Link key={c.id} href={`/contratos/${c.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{c.cliente?.nomeFantasia || c.cliente?.nome}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${corContratoStatus(c.status)}22`, color: corContratoStatus(c.status) }}>
                      {rotuloContratoStatus(c.status)}
                    </span>
                  </div>
                  {c.descricao && <p className="truncate text-xs text-muted-foreground">{c.descricao}</p>}
                  <p className="flex items-center gap-1.5 text-sm font-semibold tabular-nums">
                    <Repeat className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {formatBRL(c.valorMensal)}<span className="text-xs font-normal text-muted-foreground">/mês</span>
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
