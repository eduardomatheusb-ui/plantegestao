import Link from "next/link";
import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { salvarPlanejamento } from "@/lib/clientes/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata = { title: "Planejamento da conta — Plante" };

const CAMPOS: { name: string; label: string; rows?: number }[] = [
  { name: "objetivoPrincipal", label: "Objetivo principal do período", rows: 2 },
  { name: "pilares", label: "Pilares de conteúdo" },
  { name: "produtosPrioritarios", label: "Produtos prioritários" },
  { name: "datasImportantes", label: "Datas importantes" },
  { name: "acoesOnline", label: "Ações on-line" },
  { name: "acoesOffline", label: "Ações off-line" },
  { name: "producaoAudiovisual", label: "Produção audiovisual" },
  { name: "indicadores", label: "Indicadores acompanhados" },
];

export default async function PlanejamentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ano?: string; mes?: string }>;
}) {
  await requireModulo("cadastros", "EDITAR");
  const { id } = await params;
  const sp = await searchParams;

  const agora = new Date();
  const ano = sp.ano ? parseInt(sp.ano, 10) : agora.getFullYear();
  const mes = sp.mes ? parseInt(sp.mes, 10) : agora.getMonth() + 1;

  const cliente = await db.cliente.findUnique({ where: { id }, select: { id: true, nome: true, nomeFantasia: true } });
  if (!cliente) notFound();

  const p = await db.planejamentoPeriodo.findUnique({ where: { clienteId_ano_mes: { clienteId: id, ano, mes } } });
  const d = (p ?? {}) as Record<string, unknown>;
  const rotuloMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(ano, mes - 1, 1));
  const action = salvarPlanejamento.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo={`Planejamento — ${rotuloMes}`}
        descricao={`${cliente.nomeFantasia || cliente.nome} · o plano do período que guia campanhas, conteúdo e produção.`}
      />
      <Card>
        <CardContent className="pt-6">
          <form action={action} className="space-y-5">
            <input type="hidden" name="ano" value={ano} />
            <input type="hidden" name="mes" value={mes} />
            {CAMPOS.map((campo) => (
              <div key={campo.name} className="space-y-2">
                <Label htmlFor={campo.name}>{campo.label}</Label>
                <Textarea id={campo.name} name={campo.name} rows={campo.rows ?? 3} defaultValue={(d[campo.name] as string) ?? ""} />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="verbaMidia">Verba de mídia (R$)</Label>
              <Input id="verbaMidia" name="verbaMidia" inputMode="decimal" defaultValue={p?.verbaMidia != null ? String(p.verbaMidia) : ""} placeholder="Ex.: 1500" className="max-w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit">Salvar planejamento</Button>
              <Button asChild variant="ghost"><Link href={`/clientes/${id}?aba=planejamento`}>Cancelar</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
