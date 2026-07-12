import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUser } from "@/lib/rbac";
import { listarClientesAtivos } from "@/lib/projetos/queries";
import { listarJobsAprovaveis } from "@/lib/aprovacao/lote.queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CriarLoteForm } from "@/components/aprovacao/criar-lote-form";

export const metadata = { title: "Nova rodada de aprovação — Plante" };

export default async function NovaRodadaPage({ searchParams }: { searchParams: Promise<{ cliente?: string }> }) {
  await requireUser();
  const { cliente } = await searchParams;
  const clientes = await listarClientesAtivos();

  const clienteSel = cliente ? clientes.find((c) => c.id === cliente) : undefined;
  const jobs = clienteSel ? await listarJobsAprovaveis(clienteSel.id) : [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Nova rodada de aprovação"
        descricao="Agrupe várias peças de um cliente num único link. Ele aprova tudo de uma vez."
      />

      {!clienteSel ? (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <form method="get" className="space-y-3">
              <label className="block text-sm font-medium">Cliente</label>
              <select
                name="cliente"
                defaultValue=""
                required
                className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>Selecione um cliente…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              <div>
                <Button type="submit">Continuar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Cliente: <span className="font-medium text-foreground">{clienteSel.nome}</span>
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/jobs/aprovacao-lote/novo"><ArrowLeft className="size-4" /> Trocar cliente</Link>
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <CriarLoteForm clienteId={clienteSel.id} jobs={jobs} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
