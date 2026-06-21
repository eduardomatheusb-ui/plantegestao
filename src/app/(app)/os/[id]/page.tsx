import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil, Trash2, FileDown, Receipt } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterOs } from "@/lib/os/queries";
import { excluirOs } from "@/lib/os/actions";
import { STATUS_LABEL, STATUS_BADGE } from "@/lib/os/constants";
import { formatBRL, formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { OsStatusSelect } from "@/components/os/status-select";
import { OsItemRow, OsAddItem } from "@/components/os/itens";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function OsDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("os", "VER");
  const podeEditar = podeModulo(acesso.caps, "os", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "os", "ADMIN");
  const { id } = await params;
  const os = await obterOs(id);
  if (!os) notFound();

  const itens = os.itens.map((it) => ({
    id: it.id,
    descricao: it.descricao,
    quantidade: Number(it.quantidade),
    valorUnit: Number(it.valorUnit),
    valorTotal: Number(it.valorTotal),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={`Ordem de serviço #${os.numero}`}
        descricao={os.titulo}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={STATUS_BADGE[os.status]}>{STATUS_LABEL[os.status]}</Badge>
            {podeEditar && <OsStatusSelect id={os.id} status={os.status} />}
            <Button asChild variant="outline" size="sm">
              <Link href={`/imprimir/os/${os.id}`} target="_blank"><FileDown className="size-4" /> Fatura</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/imprimir/os/${os.id}?tipo=recibo`} target="_blank"><Receipt className="size-4" /> Recibo</Link>
            </Button>
            {podeEditar && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/os/${os.id}/editar`}><Pencil className="size-4" /> Editar</Link>
              </Button>
            )}
            {podeExcluir && (
              <ConfirmButton
                action={excluirOs.bind(null, os.id)}
                variant="ghost"
                triggerIcon={<Trash2 className="size-4" />}
                triggerLabel="Excluir"
                titulo="Excluir ordem de serviço?"
                descricao="Esta ação não pode ser desfeita e remove todos os itens."
                confirmarLabel="Excluir definitivamente"
              />
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-4">
          <Info rotulo="Cliente" valor={os.cliente.nome} />
          <Info rotulo="Projeto" valor={os.projeto ? <Link href={`/projetos/${os.projeto.id}`} className="hover:underline">#{os.projeto.numero} {os.projeto.nome}</Link> : "—"} />
          <Info rotulo="Emissão" valor={formatDate(os.dataEmissao)} />
          <Info rotulo="Vencimento" valor={formatDate(os.vencimento)} />
          <Info rotulo="Forma de pagamento" valor={os.formaPagamento ?? "—"} />
          <Info rotulo="Condições" valor={os.condicoesPagamento ?? "—"} />
          <Info rotulo="Responsável" valor={os.responsavel?.nome ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {itens.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum item ainda.</p>
          ) : (
            itens.map((it) => <OsItemRow key={it.id} item={it} />)
          )}
          {podeEditar && <OsAddItem osId={os.id} />}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-muted-foreground">Total</span>
            <span className="font-display text-2xl font-bold tabular-nums">{formatBRL(Number(os.valorTotal))}</span>
          </div>
        </CardContent>
      </Card>

      {os.observacao && (
        <Card>
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm">{os.observacao}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="os" entidadeId={os.id} /></CardContent>
      </Card>
    </div>
  );
}
