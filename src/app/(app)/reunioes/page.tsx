import Link from "next/link";
import { Plus, Calendar, Building2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { listarReunioes } from "@/lib/reunioes/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function ReunioesPage() {
  await requireModulo("projetos", "VER");
  const reunioes = await listarReunioes();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Atas de reunião"
        descricao="Registro de decisões e próximos passos das reuniões."
        acao={<Button asChild><Link href="/reunioes/novo"><Plus className="size-4" /> Nova ata</Link></Button>}
      />

      {reunioes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma ata registrada ainda. Crie a primeira com &quot;Nova ata&quot;.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {reunioes.map((r) => (
            <Link key={r.id} href={`/reunioes/${r.id}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
              <Card className="h-full transition-colors hover:border-primary/50">
                <CardContent className="space-y-2 pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{r.titulo}</p>
                    <Badge variant={r.ata ? "success" : "muted"} className="shrink-0">{r.ata ? "Com ata" : "Sem ata"}</Badge>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="size-3.5" aria-hidden="true" /> {dataBR(r.data)}
                  </p>
                  {r.cliente && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="size-3.5" aria-hidden="true" /> {r.cliente.nome}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
