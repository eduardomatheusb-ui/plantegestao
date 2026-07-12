import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, CheckCircle2, PenLine, Clock, Layers } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { obterLoteInterno } from "@/lib/aprovacao/lote.queries";
import { BrandHero } from "@/components/shared/brand-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConviteLink } from "@/components/admin/convite-link";

export const metadata = { title: "Rodada de aprovação — Plante" };

function dataBR(d: Date | null | undefined) {
  if (!d) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

export default async function LoteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireUser();
  const lote = await obterLoteInterno(id);
  if (!lote) notFound();

  const respondidos = lote.itens.filter((i) => i.decisao).length;
  const aprovados = lote.itens.filter((i) => i.decisao === "aprovado").length;
  const ajustes = lote.itens.filter((i) => i.decisao === "ajustes").length;

  return (
    <div className="space-y-6">
      <BrandHero
        titulo={lote.titulo || "Rodada de aprovação"}
        subtitulo={`${lote.cliente?.nome ?? ""} · ${lote.itens.length} peça${lote.itens.length === 1 ? "" : "s"}`}
        icon={Layers}
        statusLabel={lote.status === "encerrado" ? "Concluída" : "Aberta"}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Link do cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Compartilhe este link. O cliente aprova todas as peças de uma vez, sem login.
          </p>
          <ConviteLink url={`/aprovar/lote/${lote.token}`} />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button asChild variant="outline" size="sm">
              <a href={`/aprovar/lote/${lote.token}`} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" /> Abrir como cliente
              </a>
            </Button>
          </div>
          <div className="flex flex-wrap gap-4 pt-2 text-sm">
            <span className="text-muted-foreground">Respondidas: <strong className="text-foreground">{respondidos}/{lote.itens.length}</strong></span>
            <span className="text-emerald-600">✓ {aprovados} aprovada{aprovados === 1 ? "" : "s"}</span>
            <span className="text-amber-600">✎ {ajustes} com ajustes</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peças da rodada</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {lote.itens.map((it) => (
              <li key={it.jobId} className="flex items-center gap-3 p-4">
                <span className="shrink-0">
                  {it.decisao === "aprovado" ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : it.decisao === "ajustes" ? (
                    <PenLine className="size-5 text-amber-600" />
                  ) : (
                    <Clock className="size-5 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/jobs/${it.job.id}`} className="text-sm font-medium hover:underline">
                    <span className="text-muted-foreground">#{it.job.numero}</span> {it.job.titulo}
                  </Link>
                  {it.comentario && <p className="mt-0.5 text-xs text-muted-foreground">&ldquo;{it.comentario}&rdquo;{it.autorNome ? ` — ${it.autorNome}` : ""}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{it.respondidoEm ? dataBR(it.respondidoEm) : "aguardando"}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Criada por {lote.criadoPor?.nome ?? "—"} em {dataBR(lote.criadoEm)}
        {lote.encerradoEm && <> · concluída em {dataBR(lote.encerradoEm)}</>}
      </p>
    </div>
  );
}
