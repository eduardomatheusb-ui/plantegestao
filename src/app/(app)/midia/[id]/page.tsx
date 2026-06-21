import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, CheckCircle2, X, FileDown } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { obterMidiaPlano } from "@/lib/midia/queries";
import { concluirMidia, excluirMidia, removerPeca } from "@/lib/midia/actions";
import { calcularTotaisMidia } from "@/lib/midia/calculo";
import { STATUS_LABEL, STATUS_BADGE, TIPO_LABEL, TIPO_SIGLA } from "@/lib/midia/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { InlineAction } from "@/components/shared/inline-action";
import { MidiaStatusSelect } from "@/components/midia/status-select";
import { PecaAddForm, GradeAddForm } from "@/components/midia/add-forms";
import { GradeCard } from "@/components/midia/grade-card";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function MidiaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const podeEditar = podePapel(user.papel, "GESTOR");
  const podeExcluir = podePapel(user.papel, "SOCIO_DIRETOR");

  const plano = await obterMidiaPlano(id);
  if (!plano) notFound();

  const diario = plano.tipo === "RADIO" || plano.tipo === "TV";
  const linhasCalc = plano.grades.flatMap((g) =>
    g.linhas.map((l) => ({
      totalInsercoes: diario ? l.insercoes.reduce((a, i) => a + i.quantidade, 0) : l.quantidade,
      valorInsercao: Number(l.valorInsercao),
      desconto: Number(l.desconto),
    })),
  );
  const totais = calcularTotaisMidia(linhasCalc, Number(plano.comissaoPct), Number(plano.honorarios));
  const pecasSimple = plano.pecas.map((p) => ({ id: p.id, codigo: p.codigo, nome: p.nome }));
  const anoAtual = new Date().getFullYear();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Mídia ${TIPO_LABEL[plano.tipo]} #${plano.numero}.${plano.versao}`}
        descricao={`${plano.titulo} · ${plano.cliente?.nome ?? ""}`}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{TIPO_SIGLA[plano.tipo]}</Badge>
            <Badge variant={STATUS_BADGE[plano.status]}>{STATUS_LABEL[plano.status]}</Badge>
            {podeEditar && <MidiaStatusSelect id={plano.id} status={plano.status} />}
            {podeEditar && plano.status !== "APROVADA" && (
              <form action={concluirMidia.bind(null, plano.id)}>
                <Button type="submit" size="sm"><CheckCircle2 className="size-4" />Concluir</Button>
              </form>
            )}
            <Button asChild variant="outline" size="sm">
              <Link href={`/imprimir/midia/${plano.id}`} target="_blank"><FileDown className="size-4" />Exportar PI</Link>
            </Button>
            {podeEditar && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/midia/${plano.id}/editar`}><Pencil className="size-4" />Editar</Link>
              </Button>
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirMidia.bind(null, plano.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir plano de mídia?"
                descricao="Remove peças, grades e inserções. Não pode ser desfeito."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      {/* Informações */}
      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3 lg:grid-cols-4">
          <Info rotulo="Cliente" valor={plano.cliente?.nome ?? "—"} />
          <Info rotulo="Projeto" valor={plano.projeto ? <Link href={`/projetos/${plano.projeto.id}`} className="hover:underline">#{plano.projeto.numero}</Link> : "—"} />
          <Info rotulo="Target" valor={plano.target ?? "—"} />
          <Info rotulo="Prazo" valor={formatDate(plano.prazo)} />
          <Info rotulo="Veículo" valor={plano.veiculo?.nome ?? "—"} />
          <Info rotulo="Contato" valor={plano.contatoVeiculo ?? "—"} />
          <Info rotulo="Rede / Tipo" valor={`${plano.rede ?? "—"} / ${plano.tipoRede ?? "—"}`} />
          <Info rotulo="Nº orçamento" valor={plano.numOrcamento ?? "—"} />
          <Info rotulo="Comissão" valor={`${Number(plano.comissaoPct)}%`} />
          <Info rotulo="Honorários" valor={formatBRL(Number(plano.honorarios))} />
          <Info rotulo="Bonificação" valor={formatBRL(Number(plano.bonificacao))} />
        </CardContent>
      </Card>

      {/* Peças */}
      <Card>
        <CardHeader><CardTitle>Peças (criativos)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {plano.pecas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma peça ainda.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {plano.pecas.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-full border border-border py-1 pl-3 pr-2 text-sm">
                  <span className="font-semibold text-brand-yellow">{p.codigo}</span>
                  {p.nome}
                  {podeEditar && (
                    <InlineAction action={removerPeca.bind(null, p.id)} title="Remover peça" className="p-0.5">
                      <X className="size-3.5" />
                    </InlineAction>
                  )}
                </li>
              ))}
            </ul>
          )}
          {podeEditar && <PecaAddForm planoId={plano.id} />}
        </CardContent>
      </Card>

      {/* Grades */}
      <Card>
        <CardHeader><CardTitle>Grade de inserções</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {plano.grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma grade ainda. Adicione uma praça/mês abaixo.</p>
          ) : (
            <div className="space-y-6">
              {plano.grades.map((g) => (
                <GradeCard key={g.id} grade={g} pecas={pecasSimple} podeEditar={podeEditar} diario={diario} />
              ))}
            </div>
          )}
          {podeEditar && (
            <div className="border-t border-border pt-4">
              <GradeAddForm planoId={plano.id} anoAtual={anoAtual} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faturamento */}
      <Card>
        <CardHeader><CardTitle>Faturamento</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {plano.instrucoesFaturamento && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{plano.instrucoesFaturamento}</p>
          )}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <Info rotulo="Total da Mídia" valor={<span className="font-display text-lg font-bold">{formatBRL(totais.totalMidia)}</span>} />
            <Info rotulo={`Comissão (${Number(plano.comissaoPct)}%)`} valor={formatBRL(totais.comissao)} />
            <Info rotulo="Valor Líquido" valor={formatBRL(totais.valorLiquido)} />
            <Info rotulo="Bonificação" valor={formatBRL(Number(plano.bonificacao))} />
            <Info rotulo="Valor Total" valor={<span className="font-display text-lg font-bold text-foreground">{formatBRL(totais.valorTotal)}</span>} />
          </div>
          <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Modelo de repasse: a agência recebe do cliente e repassa ao veículo. A comissão é a parte da agência embutida no Total da Mídia; os honorários são somados no Valor Total.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
