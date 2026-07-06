import Link from "next/link";
import { Plus } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { listarReembolsos, totalReembolso, type ReembolsoLista } from "@/lib/reembolsos/queries";
import { rotuloCompetencia } from "@/lib/reembolsos/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ReembolsoStatusBadge } from "@/components/reembolsos/status-badge";

function Lista({ itens, mostrarSolicitante }: { itens: ReembolsoLista[]; mostrarSolicitante: boolean }) {
  return (
    <ul className="divide-y divide-border">
      {itens.map((r) => (
        <li key={r.id}>
          <Link href={`/reembolsos/${r.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-1 py-3 transition-colors hover:bg-muted/50">
            <span className="w-14 shrink-0 text-sm font-semibold tabular-nums">#{r.numero}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {mostrarSolicitante ? r.solicitante.nome : `Competência ${rotuloCompetencia(r.competenciaAno, r.competenciaMes)}`}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {mostrarSolicitante && `Competência ${rotuloCompetencia(r.competenciaAno, r.competenciaMes)} · `}
                {r.dataPagamento ? `Pago em ${formatDate(r.dataPagamento)}` : r.dataPrevistaPagamento ? `Previsto ${formatDate(r.dataPrevistaPagamento)}` : "—"}
              </p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">{formatBRL(totalReembolso(r.despesas))}</span>
            <span className="shrink-0"><ReembolsoStatusBadge status={r.status} /></span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function ReembolsosPage() {
  const user = await requireUser();
  const acesso = await acessoAtual();
  const ehFinanceiro = podeModulo(acesso.caps, "financeiro", "EDITAR");

  const meus = await listarReembolsos({ solicitanteId: user.id });
  const todos = ehFinanceiro ? await listarReembolsos({}) : [];
  const pendentes = todos.filter((r) => r.status === "ENVIADO" || r.status === "PENDENTE_AJUSTE");

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Central de Reembolsos"
        descricao="Peça reembolso de despesas operacionais e acompanhe a aprovação e o pagamento."
        acao={<Button asChild><Link href="/reembolsos/novo"><Plus className="size-4" /> Novo reembolso</Link></Button>}
      />

      {ehFinanceiro && (
        <Card>
          <CardHeader><CardTitle>Aguardando análise ({pendentes.length})</CardTitle></CardHeader>
          <CardContent>
            {pendentes.length === 0
              ? <p className="text-sm text-muted-foreground">Nenhum pedido aguardando análise.</p>
              : <Lista itens={pendentes} mostrarSolicitante />}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Meus pedidos ({meus.length})</CardTitle></CardHeader>
        <CardContent>
          {meus.length === 0 ? (
            <EmptyState
              titulo="Você ainda não pediu reembolso"
              descricao="Crie um pedido, lance suas despesas com comprovante e envie para o financeiro."
              acao={<Button asChild><Link href="/reembolsos/novo"><Plus className="size-4" /> Novo reembolso</Link></Button>}
            />
          ) : (
            <Lista itens={meus} mostrarSolicitante={false} />
          )}
        </CardContent>
      </Card>

      {ehFinanceiro && todos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Todos os pedidos ({todos.length})</CardTitle></CardHeader>
          <CardContent><Lista itens={todos} mostrarSolicitante /></CardContent>
        </Card>
      )}
    </div>
  );
}
