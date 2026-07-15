import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, FileDown, CheckCircle2, Eye, EyeOff, FolderPlus, FileSignature, Handshake } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { db } from "@/lib/db";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterProposta, listarProdutosAtivos } from "@/lib/propostas/queries";
import { concluirProposta, excluirProposta, gerarProjetoDaProposta } from "@/lib/propostas/actions";
import { GerarFinanceiro } from "@/components/propostas/gerar-financeiro";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/propostas/status";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { TextoComLinks } from "@/components/shared/texto-com-links";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { PropostaStatusSelect } from "@/components/propostas/status-select";
import { IntroducaoEditor } from "@/components/propostas/introducao-editor";
import { ConsideracoesEditor } from "@/components/propostas/consideracoes-editor";
import { AddItemForm } from "@/components/propostas/add-item-form";
import { ItemRow } from "@/components/propostas/item-row";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function PropostaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const [proposta, produtos, lancamentos, contratoVinc, acesso] = await Promise.all([
    obterProposta(id),
    listarProdutosAtivos(),
    db.lancamento.findMany({ where: { propostaId: id }, orderBy: { parcelaNum: "asc" }, select: { id: true, valor: true } }),
    db.contrato.findFirst({ where: { propostaId: id }, select: { id: true } }),
    acessoAtual(),
  ]);
  if (!proposta) notFound();
  const podeFin = podeModulo(acesso.caps, "financeiro", "EDITAR");
  const totalLancado = lancamentos.reduce((s, l) => s + Number(l.valor), 0);

  // Converte Decimal → number antes de passar a componentes client (serialização).
  const produtosPlain = produtos.map((p) => ({
    id: p.id,
    nome: p.nome,
    descricao: p.descricao,
    valorUnit: Number(p.valorUnit),
  }));
  const itensPlain = proposta.itens.map((it) => ({
    id: it.id,
    nome: it.nome,
    descricao: it.descricao,
    valorUnit: Number(it.valorUnit),
    quantidade: Number(it.quantidade),
    desconto: Number(it.desconto),
    subtotal: Number(it.subtotal),
    visivel: it.visivel,
  }));

  const validadeAte = proposta.prazo
    ? null
    : new Date(new Date(proposta.criadoEm).getTime() + proposta.validadeDias * 86400000);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Proposta #${proposta.numero}.${proposta.versao} · ${proposta.titulo}`}
        descricao={proposta.cliente?.nome}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[proposta.status]}>{STATUS_LABEL[proposta.status]}</Badge>
            {podeEditar && <PropostaStatusSelect id={proposta.id} status={proposta.status} />}
            {podeEditar && proposta.status !== "APROVADA" && (
              <form action={concluirProposta.bind(null, proposta.id)}>
                <Button type="submit" size="sm">
                  <CheckCircle2 className="size-4" />
                  Concluir
                </Button>
              </form>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/imprimir/proposta/${proposta.id}`} target="_blank">
                <FileDown className="size-4" />
                Exportar PDF
              </Link>
            </Button>
            {podeEditar && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/propostas/${proposta.id}/editar`}>
                  <Pencil className="size-4" />
                  Editar
                </Link>
              </Button>
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirProposta.bind(null, proposta.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir proposta?"
                descricao="Esta ação não pode ser desfeita e remove todos os itens."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      {/* Fechar negócio — projeto + contrato + financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Handshake className="size-4" /> Fechar negócio</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projeto</p>
            {proposta.projetoId ? (
              <Button asChild variant="outline" size="sm"><Link href={`/projetos/${proposta.projetoId}`}>Abrir projeto</Link></Button>
            ) : podeEditar ? (
              <form action={gerarProjetoDaProposta.bind(null, proposta.id)}>
                <Button type="submit" size="sm" variant="outline"><FolderPlus className="size-4" /> Gerar projeto</Button>
              </form>
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contrato</p>
            {contratoVinc ? (
              <Button asChild variant="outline" size="sm"><Link href={`/contratos/${contratoVinc.id}`}>Abrir contrato</Link></Button>
            ) : podeFin ? (
              <Button asChild variant="outline" size="sm"><Link href={`/contratos/novo?proposta=${proposta.id}`}><FileSignature className="size-4" /> Registrar contrato</Link></Button>
            ) : <p className="text-sm text-muted-foreground">Sem acesso ao financeiro.</p>}
          </div>

          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Financeiro</p>
            {lancamentos.length > 0 ? (
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                ✓ Lançado — {formatBRL(totalLancado)}{lancamentos.length > 1 ? ` (${lancamentos.length}x)` : ""}
                <Link href="/financeiro" className="ml-2 text-xs font-normal text-muted-foreground underline">ver</Link>
              </p>
            ) : podeFin ? (
              <GerarFinanceiro propostaId={proposta.id} valorLabel={formatBRL(Number(proposta.valorTotal))} />
            ) : <p className="text-sm text-muted-foreground">Sem acesso ao financeiro.</p>}
          </div>
        </CardContent>
      </Card>

      {/* Barra de informações */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-4">
          <Info rotulo="Cliente" valor={proposta.cliente?.nome ?? "—"} />
          <Info
            rotulo="Projeto"
            valor={proposta.projeto ? <Link href={`/projetos/${proposta.projeto.id}`} className="hover:underline">#{proposta.projeto.numero} {proposta.projeto.nome}</Link> : "—"}
          />
          <Info rotulo="Validade" valor={`${proposta.validadeDias} dias${validadeAte ? ` (até ${formatDate(validadeAte)})` : ""}`} />
          <Info rotulo="Prazo" valor={formatDate(proposta.prazo)} />
        </CardContent>
      </Card>

      {/* Introdução */}
      <Card>
        <CardHeader><CardTitle>Introdução</CardTitle></CardHeader>
        <CardContent>
          {podeEditar ? (
            <IntroducaoEditor id={proposta.id} introducao={proposta.introducao} />
          ) : proposta.introducao ? (
            <TextoComLinks texto={proposta.introducao} className="text-sm" />
          ) : (
            <p className="text-sm text-muted-foreground">Sem introdução.</p>
          )}
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardHeader><CardTitle>Itens da proposta</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {proposta.itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
          ) : (
            <>
              <div className="hidden gap-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid sm:grid-cols-12">
                <span className="sm:col-span-4">Item</span>
                <span className="sm:col-span-2 text-right">Valor unit.</span>
                <span className="sm:col-span-2 text-right">Qtd.</span>
                <span className="sm:col-span-2 text-right">Desconto</span>
                <span className="sm:col-span-2 text-right">Subtotal</span>
              </div>
              <div className="space-y-3">
                {podeEditar
                  ? itensPlain.map((it, i) => (
                      <ItemRow key={it.id} item={it} isFirst={i === 0} isLast={i === itensPlain.length - 1} />
                    ))
                  : proposta.itens.map((it) => (
                      <div key={it.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                        <span className="flex items-center gap-2">
                          {it.visivel ? <Eye className="size-3.5 text-muted-foreground" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
                          <span className="font-medium">{it.nome}</span>
                        </span>
                        <span className="font-semibold tabular-nums">{formatBRL(Number(it.subtotal))}</span>
                      </div>
                    ))}
              </div>
            </>
          )}

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-muted-foreground">Total geral (itens visíveis)</span>
            <span className="font-display text-2xl font-bold tabular-nums">{formatBRL(Number(proposta.valorTotal))}</span>
          </div>

          {podeEditar && <AddItemForm propostaId={proposta.id} produtos={produtosPlain} />}
        </CardContent>
      </Card>

      {/* Considerações finais */}
      <Card>
        <CardHeader><CardTitle>Considerações finais</CardTitle></CardHeader>
        <CardContent>
          {podeEditar ? (
            <ConsideracoesEditor id={proposta.id} consideracoes={proposta.consideracoesFinais} />
          ) : proposta.consideracoesFinais ? (
            <TextoComLinks texto={proposta.consideracoesFinais} className="text-sm" />
          ) : (
            <p className="text-sm text-muted-foreground">Sem considerações finais.</p>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent>
          <HistoryPanel entidadeTipo="proposta" entidadeId={proposta.id} />
        </CardContent>
      </Card>
    </div>
  );
}
