import Link from "next/link";
import { Plus, Megaphone } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarCampanhas } from "@/lib/trafego/queries";
import { rotuloPlataforma, corPlataforma, rotuloStatusCampanha, corStatusCampanha } from "@/lib/trafego/constantes";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

export default async function TrafegoPage() {
  await requireModulo("midia", "VER");
  const campanhas = await listarCampanhas();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Tráfego / anúncios"
        descricao="Campanhas pagas (Meta, Google e outras) e seus resultados."
        acao={<Button asChild><Link href="/trafego/novo"><Plus className="size-4" /> Nova campanha</Link></Button>}
      />

      {campanhas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma campanha ainda. Crie a primeira com &quot;Nova campanha&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((c) => (
            <Link key={c.id} href={`/trafego/${c.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{c.nome}</p>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${corStatusCampanha(c.status)}22`, color: corStatusCampanha(c.status) }}>
                      {rotuloStatusCampanha(c.status)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{c.cliente?.nomeFantasia || c.cliente?.nome}</p>
                  <p className="flex items-center gap-1.5 text-xs">
                    <Megaphone className="size-3.5" style={{ color: corPlataforma(c.plataforma) }} aria-hidden="true" />
                    {rotuloPlataforma(c.plataforma)}
                  </p>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-xs">
                    <span className="text-muted-foreground">Investido <span className="font-medium text-foreground tabular-nums">{formatBRL(c.investido)}</span></span>
                    <span className="text-muted-foreground">Leads <span className="font-medium text-foreground tabular-nums">{c.leads}</span></span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
