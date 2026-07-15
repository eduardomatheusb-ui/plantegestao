import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireModulo, verTudoNoModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { podeModulo } from "@/lib/permissoes";
import { obterCampanha } from "@/lib/trafego/queries";
import { TextoComLinks } from "@/components/shared/texto-com-links";
import { excluirCampanha } from "@/lib/trafego/actions";
import { rotuloPlataforma, rotuloStatusCampanha, corStatusCampanha } from "@/lib/trafego/constantes";
import { BrandHero } from "@/components/shared/brand-hero";
import { Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { ResultadosPanel } from "@/components/trafego/resultados-panel";
import { HistoryPanel } from "@/components/shared/history-panel";
import { formatBRL } from "@/lib/utils";

function dataBR(d: Date | null) {
  return d ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d)) : "—";
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums">{valor}</p>
    </div>
  );
}

export default async function CampanhaDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("midia", "VER");
  const podeEditar = podeModulo(acesso.caps, "midia", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "midia", "ADMIN");
  const { id } = await params;
  const c = await obterCampanha(id);
  if (!c) notFound();
  if (!verTudoNoModulo(acesso, "midia")) {
    const meu = await db.campanha.findFirst({ where: { id, criadoPorId: acesso.id }, select: { id: true } });
    if (!meu) notFound();
  }

  const t = c.totais;

  return (
    <div className="space-y-6">
      <BrandHero
        titulo={c.nome}
        subtitulo={`${c.cliente?.nomeFantasia || c.cliente?.nome} · ${rotuloPlataforma(c.plataforma)}`}
        icon={Megaphone}
        statusLabel={rotuloStatusCampanha(c.status)}
        statusCor={corStatusCampanha(c.status)}
        acoes={
          <>
            <Button asChild variant="outline" size="sm"><Link href="/trafego"><ArrowLeft className="size-4" /> Campanhas</Link></Button>
            {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/trafego/${c.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
            {podeExcluir && (
              <ConfirmButton action={excluirCampanha.bind(null, c.id)} variant="ghost" triggerIcon={<Trash2 className="size-4" />} triggerLabel="Excluir" titulo="Excluir campanha?" descricao="Os resultados lançados também serão removidos. Esta ação não pode ser desfeita." confirmarLabel="Excluir" />
            )}
          </>
        }
      />

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3 lg:grid-cols-6">
          <Metrica rotulo="Verba" valor={c.verba != null ? formatBRL(c.verba) : "—"} />
          <Metrica rotulo="Investido" valor={formatBRL(t.investido)} />
          <Metrica rotulo="Alcance" valor={t.alcance.toLocaleString("pt-BR")} />
          <Metrica rotulo="Cliques" valor={t.cliques.toLocaleString("pt-BR")} />
          <Metrica rotulo="Leads" valor={t.leads.toLocaleString("pt-BR")} />
          <Metrica rotulo="CPL" valor={t.cpl != null ? formatBRL(t.cpl) : "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid grid-cols-2 gap-6 pt-6 text-sm sm:grid-cols-4">
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Período</p><p className="mt-0.5 font-medium">{dataBR(c.dataInicio)} – {dataBR(c.dataFim)}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Objetivo</p><p className="mt-0.5 font-medium">{c.objetivo ?? "—"}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">CTR</p><p className="mt-0.5 font-medium">{t.ctr != null ? `${t.ctr.toFixed(2)}%` : "—"}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Conversões</p><p className="mt-0.5 font-medium tabular-nums">{t.conversoes.toLocaleString("pt-BR")}</p></div>
          {c.observacao && <div className="sm:col-span-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">Observação</p><TextoComLinks texto={c.observacao} className="mt-0.5" /></div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
        <CardContent>
          <ResultadosPanel campanhaId={c.id} resultados={c.resultados} podeEditar={podeEditar} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="campanha" entidadeId={c.id} /></CardContent>
      </Card>
    </div>
  );
}
