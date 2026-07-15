import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterLead } from "@/lib/crm/queries";
import { excluirLead } from "@/lib/crm/actions";
import { rotuloEtapa, corEtapa } from "@/lib/crm/etapas";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { ConverterButton } from "@/components/crm/converter-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { TextoComLinks } from "@/components/shared/texto-com-links";
import { formatBRL, formatDate } from "@/lib/utils";

function Info({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm font-medium">{valor}</p>
    </div>
  );
}

export default async function LeadDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("propostas", "VER");
  const podeEditar = podeModulo(acesso.caps, "propostas", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "propostas", "ADMIN");
  const { id } = await params;
  const l = await obterLead(id);
  if (!l) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={l.nome}
        descricao={l.empresa ?? "Lead"}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: `${corEtapa(l.etapa)}22`, color: corEtapa(l.etapa) }}>
              {rotuloEtapa(l.etapa)}
            </span>
            <Button asChild variant="outline" size="sm"><Link href="/crm"><ArrowLeft className="size-4" /> Funil</Link></Button>
            {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/crm/${l.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
            {podeEditar && <ConverterButton id={l.id} jaConvertido={!!l.clienteId} clienteId={l.clienteId} />}
            {podeExcluir && (
              <ConfirmButton action={excluirLead.bind(null, l.id)} variant="ghost" triggerIcon={<Trash2 className="size-4" />} triggerLabel="Excluir" titulo="Excluir lead?" descricao="Esta ação não pode ser desfeita." confirmarLabel="Excluir" />
            )}
          </div>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 sm:grid-cols-3">
          <Info rotulo="E-mail" valor={l.email ?? "—"} />
          <Info rotulo="Telefone" valor={l.telefone ?? "—"} />
          <Info rotulo="Origem" valor={l.origem ?? "—"} />
          {l.interesse && <Info rotulo="Interesse" valor={l.interesse} />}
          <Info rotulo="Valor estimado" valor={l.valorEstimado ? formatBRL(l.valorEstimado) : "—"} />
          <Info rotulo="Cliente" valor={l.cliente ? <Link href={`/cadastros/clientes/${l.cliente.id}`} className="hover:underline">{l.cliente.nome}</Link> : "Ainda não convertido"} />
          {l.consentLgpd && (
            <Info
              rotulo="Consentimento (LGPD)"
              valor={<span className="text-emerald-600 dark:text-emerald-400">Aceito{l.consentEm ? ` · ${formatDate(l.consentEm)}` : ""}</span>}
            />
          )}
          {l.etapa === "perdido" && <Info rotulo="Motivo da perda" valor={l.motivoPerda ?? "—"} />}
          {l.tags.length > 0 && (
            <div className="col-span-2 space-y-1 sm:col-span-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {l.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {l.observacao && (
        <Card>
          <CardHeader><CardTitle>Observação</CardTitle></CardHeader>
          <CardContent><TextoComLinks texto={l.observacao} className="text-sm" /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="lead" entidadeId={l.id} /></CardContent>
      </Card>
    </div>
  );
}
