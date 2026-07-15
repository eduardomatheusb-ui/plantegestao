import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, CheckCircle2, FileDown } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { acessoAtual, verTudoNoModulo } from "@/lib/permissoes.server";
import { obterProducao } from "@/lib/producao/queries";
import { concluirProducao, excluirProducao } from "@/lib/producao/actions";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/producao/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { ProducaoStatusSelect } from "@/components/producao/status-select";
import { ProducaoItemRow, ProducaoAddItem } from "@/components/producao/itens";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function ProducaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const ordem = await obterProducao(id);
  if (!ordem) notFound();
  const acesso = await acessoAtual();
  if (!verTudoNoModulo(acesso, "producao")) {
    const meu = await db.producaoOrdem.findFirst({ where: { id, OR: [{ criadoPorId: user.id }, { responsavelId: user.id }] }, select: { id: true } });
    if (!meu) notFound();
  }

  const comissao = (Number(ordem.valorTotal) * Number(ordem.comissaoPct)) / 100;
  const liquido = Number(ordem.valorTotal) - comissao;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Produção #${ordem.numero}.${ordem.versao} · ${ordem.titulo}`}
        descricao={ordem.cliente?.nome}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[ordem.status]}>{STATUS_LABEL[ordem.status]}</Badge>
            {podeEditar && <ProducaoStatusSelect id={ordem.id} status={ordem.status} />}
            {podeEditar && ordem.status !== "APROVADA" && (
              <form action={concluirProducao.bind(null, ordem.id)}>
                <Button type="submit" size="sm"><CheckCircle2 className="size-4" />Concluir</Button>
              </form>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/imprimir/producao/${ordem.id}`} target="_blank"><FileDown className="size-4" />Exportar</Link>
            </Button>
            {podeEditar && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/producao/${ordem.id}/editar`}><Pencil className="size-4" />Editar</Link>
              </Button>
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirProducao.bind(null, ordem.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir ordem de produção?"
                descricao="Esta ação não pode ser desfeita e remove os itens."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <Info rotulo="Cliente" valor={ordem.cliente?.nome ?? "—"} />
          <Info rotulo="Fornecedor" valor={ordem.fornecedor?.nome ?? "—"} />
          <Info rotulo="Projeto" valor={ordem.projeto ? <Link href={`/projetos/${ordem.projeto.id}`} className="hover:underline">#{ordem.projeto.numero}</Link> : "—"} />
          <Info rotulo="Entrega" valor={formatDate(ordem.dataEntrega)} />
          <Info rotulo="Vencimento" valor={formatDate(ordem.vencimento)} />
          <Info rotulo="Comissão" valor={`${Number(ordem.comissaoPct)}%`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itens de produção</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {ordem.itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
          ) : (
            <div className="space-y-3">
              {ordem.itens.map((it) =>
                podeEditar ? (
                  <ProducaoItemRow key={it.id} item={{ id: it.id, titulo: it.titulo, quantidade: Number(it.quantidade), valorUnit: Number(it.valorUnit), valorTotal: Number(it.valorTotal) }} />
                ) : (
                  <div key={it.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                    <span className="font-medium">{it.titulo}</span>
                    <span className="font-semibold tabular-nums">{formatBRL(Number(it.valorTotal))}</span>
                  </div>
                ),
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-1 border-t border-border pt-4 text-sm">
            <span className="text-muted-foreground">Comissão ({Number(ordem.comissaoPct)}%): <span className="tabular-nums">{formatBRL(comissao)}</span></span>
            <span className="text-muted-foreground">Líquido: <span className="tabular-nums">{formatBRL(liquido)}</span></span>
            <span className="font-medium">Total: <span className="font-display text-xl font-bold tabular-nums">{formatBRL(Number(ordem.valorTotal))}</span></span>
          </div>

          {podeEditar && <ProducaoAddItem ordemId={ordem.id} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="producao" entidadeId={ordem.id} /></CardContent>
      </Card>
    </div>
  );
}
