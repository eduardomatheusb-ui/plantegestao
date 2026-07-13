import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterContrato } from "@/lib/contratos/queries";
import { rotuloContratoStatus, corContratoStatus } from "@/lib/contratos/constantes";
import { excluirContrato } from "@/lib/contratos/actions";
import { BrandHero } from "@/components/shared/brand-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { iniciais } from "@/lib/format";
import { formatBRL } from "@/lib/utils";

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d)) : "—";
}

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function ContratoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("financeiro", "VER");
  const podeEditar = podeModulo(acesso.caps, "financeiro", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "financeiro", "ADMIN");
  const { id } = await params;
  const c = await obterContrato(id);
  if (!c) notFound();

  return (
    <div className="space-y-6">
      <BrandHero
        titulo={c.cliente?.nomeFantasia || c.cliente?.nome || "Contrato"}
        subtitulo={c.tipo === "pontual" ? `${formatBRL(c.valorTotal ?? 0)}${c.servico ? ` · ${c.servico}` : ""}` : `${formatBRL(c.valorMensal ?? 0)}/mês`}
        inicial={iniciais(c.cliente?.nomeFantasia || c.cliente?.nome || "?")}
        statusLabel={rotuloContratoStatus(c.status)}
        statusCor={corContratoStatus(c.status)}
        acoes={
          <>
            <Button asChild variant="outline" size="sm"><Link href="/contratos"><ArrowLeft className="size-4" /> Contratos</Link></Button>
            {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/contratos/${c.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
            {podeExcluir && (
              <ConfirmButton action={excluirContrato.bind(null, c.id)} variant="ghost" triggerIcon={<Trash2 className="size-4" />} triggerLabel="Excluir" titulo="Excluir contrato?" descricao="Esta ação não pode ser desfeita." confirmarLabel="Excluir" />
            )}
          </>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3">
          <Info rotulo="Cliente" valor={<Link href={`/cadastros/clientes/${c.cliente?.id}`} className="hover:underline">{c.cliente?.nome}</Link>} />
          <Info rotulo="Tipo" valor={c.tipo === "pontual" ? "Pontual (serviço)" : "Recorrente (fee)"} />
          {c.tipo === "pontual" ? (
            <>
              <Info rotulo="Serviço" valor={c.servico ?? "—"} />
              <Info rotulo="Valor total" valor={formatBRL(c.valorTotal ?? 0)} />
            </>
          ) : (
            <>
              <Info rotulo="Valor mensal" valor={formatBRL(c.valorMensal ?? 0)} />
              <Info rotulo="Dia de cobrança" valor={c.diaVencimento ?? "—"} />
            </>
          )}
          <Info rotulo="Início" valor={dataBR(c.dataInicio)} />
          <Info rotulo={c.tipo === "pontual" ? "Validade" : "Fim"} valor={c.dataFim ? dataBR(c.dataFim) : "Vigente"} />
          <Info rotulo="Status" valor={rotuloContratoStatus(c.status)} />
          {c.descricao && <div className="sm:col-span-3"><Info rotulo="Escopo" valor={<span className="whitespace-pre-wrap font-normal">{c.descricao}</span>} /></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="contrato" entidadeId={c.id} /></CardContent>
      </Card>
    </div>
  );
}
