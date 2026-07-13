import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { salvarDossie } from "@/lib/clientes/actions";
import { CAMPOS_DOSSIE } from "@/lib/clientes/dossie";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Dossiê estratégico — Plante" };

export default async function DossiePage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("cadastros", "EDITAR");
  const { id } = await params;

  const cliente = await db.cliente.findUnique({
    where: { id },
    select: { id: true, nome: true, nomeFantasia: true, dossie: true },
  });
  if (!cliente) notFound();

  const d = (cliente.dossie ?? {}) as Record<string, string | null>;
  const action = salvarDossie.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Dossiê estratégico"
        descricao={`A memória da conta ${cliente.nomeFantasia || cliente.nome} — orienta qualquer pessoa antes de produzir.`}
      />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="space-y-5">
            {CAMPOS_DOSSIE.map((campo) => (
              <div key={campo.name} className={"destaque" in campo && campo.destaque ? "rounded-lg border-2 border-brand-yellow/60 bg-[#f7ff19]/10 p-4" : undefined}>
                <div className="space-y-2">
                  <Label htmlFor={campo.name}>{campo.label}</Label>
                  {"help" in campo && campo.help && <p className="text-xs text-muted-foreground">{campo.help}</p>}
                  <Textarea id={campo.name} name={campo.name} rows={3} defaultValue={d[campo.name] ?? ""} />
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button type="submit">Salvar dossiê</Button>
              <Button asChild variant="ghost"><Link href={`/clientes/${id}?aba=dossie`}>Cancelar</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
