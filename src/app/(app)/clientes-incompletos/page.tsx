import Link from "next/link";
import { Pencil, CheckCircle2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { clientesIncompletos } from "@/lib/clientes/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Cadastros incompletos — TREM" };

export default async function ClientesIncompletosPage() {
  await requireModulo("cadastros", "VER");
  const clientes = await clientesIncompletos();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Cadastros incompletos"
        descricao="Clientes ativos com contato ou brand kit faltando. Complete para usar portal, e-mails e relatórios."
      />

      {clientes.length === 0 ? (
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-sm">
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
            Todos os clientes ativos estão com os dados essenciais preenchidos. 🎉
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{clientes.length} cliente(s) com pendências.</p>
          <div className="space-y-2">
            {clientes.map((c) => (
              <Card key={c.id}>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/clientes/${c.id}`} className="font-medium hover:underline">{c.nome}</Link>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {c.faltando.map((f) => (
                        <span key={f} className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          falta {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0">
                    <Link href={`/cadastros/clientes/${c.id}`}><Pencil className="size-4" /> Completar</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
