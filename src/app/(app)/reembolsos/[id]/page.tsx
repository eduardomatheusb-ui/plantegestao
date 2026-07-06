import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Trash2, Receipt } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterReembolso, totalReembolso, totalAprovado, opcoesDespesa } from "@/lib/reembolsos/queries";
import { adicionarDespesa, excluirReembolso } from "@/lib/reembolsos/actions";
import { CATEGORIA_LABEL, FORMA_PAGAMENTO_LABEL, rotuloCompetencia } from "@/lib/reembolsos/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { AttachmentsPanel } from "@/components/shared/attachments-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { ReembolsoStatusBadge } from "@/components/reembolsos/status-badge";
import { ReembolsoAcoes } from "@/components/reembolsos/reembolso-acoes";
import { CabecalhoForm } from "@/components/reembolsos/cabecalho-form";
import { DespesaForm } from "@/components/reembolsos/despesa-form";
import { DespesaCard, type DespesaView } from "@/components/reembolsos/despesa-card";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function ReembolsoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const acesso = await acessoAtual();
  const ehFinanceiro = podeModulo(acesso.caps, "financeiro", "EDITAR");
  const { id } = await params;

  const r = await obterReembolso(id);
  if (!r) notFound();

  const ehDono = r.solicitanteId === user.id;
  if (!ehDono && !ehFinanceiro) notFound();

  const editavel = ehDono && (r.status === "RASCUNHO" || r.status === "PENDENTE_AJUSTE");
  const podeAvaliar = ehFinanceiro && r.status === "ENVIADO";
  const total = totalReembolso(r.despesas);
  const aprovado = totalAprovado(r.despesas);
  const opcoes = await opcoesDespesa();
  const anoAtual = new Date().getFullYear();
  const temRecibo = ["APROVADO", "PROGRAMADO", "PAGO"].includes(r.status);
  const podeExcluir = acesso.papel === "SOCIO_DIRETOR" || (ehDono && r.status === "RASCUNHO");

  const despesasView: DespesaView[] = r.despesas.map((d) => {
    const iso = new Date(d.data).toISOString().slice(0, 10);
    return {
      id: d.id,
      dataISO: iso,
      dataLabel: formatDate(d.data),
      categoriaLabel: CATEGORIA_LABEL[d.categoria] ?? d.categoria,
      descricao: d.descricao,
      valor: Number(d.valor),
      formaLabel: d.formaPagamento ? (FORMA_PAGAMENTO_LABEL[d.formaPagamento] ?? d.formaPagamento) : null,
      clienteNome: d.cliente?.nome ?? null,
      projetoLabel: d.projeto ? `Proj #${d.projeto.numero}` : null,
      jobLabel: d.job ? `Job #${d.job.numero}` : null,
      centroNome: d.centroCusto?.nome ?? null,
      repassavelCliente: d.repassavelCliente,
      autorizadoPor: d.autorizadoPor ?? null,
      aprovada: d.aprovada,
      parecerItem: d.parecerItem ?? null,
      inicial: {
        data: iso,
        categoria: d.categoria,
        descricao: d.descricao,
        valor: String(Number(d.valor)),
        formaPagamento: d.formaPagamento ?? "",
        clienteId: d.clienteId ?? "",
        projetoId: d.projetoId ?? "",
        jobId: d.jobId ?? "",
        centroCustoId: d.centroCustoId ?? "",
        repassavelCliente: d.repassavelCliente,
        autorizadoPor: d.autorizadoPor ?? "",
      },
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Reembolso #${r.numero}`}
        descricao={`Competência ${rotuloCompetencia(r.competenciaAno, r.competenciaMes)} · ${r.solicitante.nome}`}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <ReembolsoStatusBadge status={r.status} />
            {temRecibo && (
              <Button asChild variant="outline" size="sm">
                <a href={`/imprimir/reembolso/${r.id}`} target="_blank" rel="noopener noreferrer"><Printer className="size-4" /> Recibo</a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm"><Link href="/reembolsos"><ArrowLeft className="size-4" /> Voltar</Link></Button>
          </div>
        }
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Info rotulo="Solicitante" valor={r.solicitante.nome} />
            <Info rotulo="Competência" valor={rotuloCompetencia(r.competenciaAno, r.competenciaMes)} />
            <Info rotulo="Total lançado" valor={<span className="tabular-nums">{formatBRL(total)}</span>} />
            <Info rotulo="Total aprovado" valor={<span className="tabular-nums font-semibold">{formatBRL(aprovado)}</span>} />
            <Info rotulo="Pagamento previsto" valor={formatDate(r.dataPrevistaPagamento)} />
            <Info rotulo="Pago em" valor={formatDate(r.dataPagamento)} />
            {r.analisadoPor && <Info rotulo="Analisado por" valor={r.analisadoPor.nome} />}
            {r.lancamento && <Info rotulo="Lançamento" valor={<Link href={`/financeiro/${r.lancamento.id}`} className="inline-flex items-center gap-1 hover:underline"><Receipt className="size-3.5" /> #{r.lancamento.numero}</Link>} />}
          </div>

          {r.observacaoSolicitante && (
            <div className="rounded-md bg-muted/40 p-3 text-sm">
              <span className="font-medium">Observação: </span>{r.observacaoSolicitante}
            </div>
          )}

          {r.parecerFinanceiro && (
            <div className={`rounded-md p-3 text-sm ${r.status === "REPROVADO" ? "bg-destructive/10 text-destructive" : "bg-warning/10"}`}>
              <span className="font-medium">Financeiro: </span>{r.parecerFinanceiro}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <ReembolsoAcoes id={r.id} status={r.status} ehDono={ehDono} ehFinanceiro={ehFinanceiro} />
            {editavel && <CabecalhoForm id={r.id} ano={r.competenciaAno} mes={r.competenciaMes} observacao={r.observacaoSolicitante ?? ""} anoAtual={anoAtual} />}
            {podeExcluir && (
              <ConfirmButton
                action={excluirReembolso.bind(null, r.id)}
                titulo="Excluir reembolso"
                descricao="Esta ação remove o pedido e todas as despesas/comprovantes. Não pode ser desfeita."
                confirmarLabel="Excluir"
                triggerLabel="Excluir"
                triggerIcon={<Trash2 className="size-3.5" />}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Despesas ({r.despesas.length})</CardTitle>
          <span className="text-sm text-muted-foreground">Total: <span className="font-semibold tabular-nums text-foreground">{formatBRL(total)}</span></span>
        </CardHeader>
        <CardContent className="space-y-4">
          {despesasView.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma despesa lançada ainda.</p>
          ) : (
            <ul className="space-y-3">
              {despesasView.map((d) => (
                <DespesaCard
                  key={d.id}
                  despesa={d}
                  opcoes={opcoes}
                  podeEditar={editavel}
                  podeAvaliar={podeAvaliar}
                  comprovantes={<AttachmentsPanel entidadeTipo="reembolso_despesa" entidadeId={d.id} />}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editavel && (
        <Card>
          <CardHeader><CardTitle>Adicionar despesa</CardTitle></CardHeader>
          <CardContent>
            <DespesaForm action={adicionarDespesa.bind(null, r.id)} opcoes={opcoes} modo="add" />
            <p className="mt-3 text-xs text-muted-foreground">Lance cada despesa separadamente. Anexe o comprovante depois de adicionar, no card da despesa.</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="reembolso" entidadeId={r.id} /></CardContent>
      </Card>
    </div>
  );
}
