import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, ArrowLeft, Receipt } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterLancamentoDetalhe } from "@/lib/financeiro/queries";
import { getEmpresa } from "@/lib/empresa";
import { valorEfetivo } from "@/lib/financeiro/calculo";
import { TIPO_LABEL, STATUS_LABEL } from "@/lib/financeiro/constants";
import { listarNotasDoLancamento } from "@/lib/nf/queries";
import { estadoFiscal } from "@/lib/nf/actions";
import { focusEmHomologacao } from "@/lib/nf/focus";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HistoryPanel } from "@/components/shared/history-panel";
import { NfPainel } from "@/components/os/nf-painel";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function LancamentoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("financeiro", "VER");
  const podeEditar = podeModulo(acesso.caps, "financeiro", "EDITAR");
  const { id } = await params;
  const l = await obterLancamentoDetalhe(id);
  if (!l) notFound();

  const valor = valorEfetivo(Number(l.valor), Number(l.acrescimos), Number(l.descontos));
  const mes = `?ano=${new Date(l.dataCompetencia).getFullYear()}&mes=${new Date(l.dataCompetencia).getMonth() + 1}`;
  const ehReceita = l.tipo === "RECEITA";

  const [notas, estado] = ehReceita
    ? await Promise.all([listarNotasDoLancamento(l.id), estadoFiscal()])
    : [[], { configurado: false, provedor: false, faltando: [] as string[] }];
  const empresa = ehReceita ? await getEmpresa() : null;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Lançamento #${l.numero}`}
        descricao={l.titulo}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={l.status === "QUITADO" ? "success" : "warning"}>{STATUS_LABEL[l.status]}</Badge>
            {ehReceita && empresa?.urlEmissaoNfse && (
              <Button asChild size="sm">
                <a href={empresa.urlEmissaoNfse} target="_blank" rel="noopener noreferrer"><Receipt className="size-4" /> Emitir nota fiscal</a>
              </Button>
            )}
            <Button asChild variant="outline" size="sm"><Link href={`/financeiro${mes}`}><ArrowLeft className="size-4" /> Voltar ao mês</Link></Button>
            {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/financeiro/${l.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-4">
          <Info rotulo="Tipo" valor={TIPO_LABEL[l.tipo]} />
          <Info rotulo="Valor" valor={<span className="tabular-nums">{formatBRL(valor)}</span>} />
          <Info rotulo="Categoria" valor={l.categoria?.nome ?? "—"} />
          <Info rotulo={l.tipo === "DESPESA" ? "Fornecedor" : "Cliente"} valor={l.cliente?.nome ?? l.fornecedor?.nome ?? "—"} />
          {l.tipo === "DESPESA" && <Info rotulo="Beneficiário" valor={l.colaborador?.nome ?? "—"} />}
          <Info rotulo="Vencimento" valor={formatDate(l.dataVencimento)} />
          <Info rotulo="Competência" valor={formatDate(l.dataCompetencia)} />
          <Info rotulo="Pagamento" valor={formatDate(l.dataPagamento)} />
          <Info rotulo="Doc/NF" valor={l.docNf ?? "—"} />
          <Info rotulo="Relacionado" valor={l.projeto ? <Link href={`/projetos/${l.projeto.id}`} className="hover:underline">Proj #{l.projeto.numero}</Link> : l.job ? `Job #${l.job.numero}` : l.os ? <Link href={`/os/${l.os.id}`} className="hover:underline">OS #{l.os.numero}</Link> : "—"} />
        </CardContent>
      </Card>

      {ehReceita && (
        <Card>
          <CardHeader><CardTitle>Nota Fiscal (NFS-e)</CardTitle></CardHeader>
          <CardContent>
            <NfPainel
              origemTipo="lancamento"
              origemId={l.id}
              notas={notas}
              podeEditar={podeEditar}
              estado={estado}
              homologacao={focusEmHomologacao()}
            />
          </CardContent>
        </Card>
      )}

      {l.observacao && (
        <Card>
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{l.observacao}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="lancamento" entidadeId={l.id} /></CardContent>
      </Card>
    </div>
  );
}
