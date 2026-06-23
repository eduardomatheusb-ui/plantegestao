import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { obterReuniao } from "@/lib/reunioes/queries";
import { excluirReuniao } from "@/lib/reunioes/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { IaAssist } from "@/components/ia/ia-assist";
import { gerarAtaIA } from "@/lib/ia/actions";

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" }).format(d);
}

function Bloco({ titulo, texto }: { titulo: string; texto: string | null }) {
  if (!texto) return null;
  return (
    <Card>
      <CardHeader><CardTitle>{titulo}</CardTitle></CardHeader>
      <CardContent><p className="whitespace-pre-wrap text-sm">{texto}</p></CardContent>
    </Card>
  );
}

export default async function ReuniaoDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const acesso = await requireModulo("projetos", "VER");
  const podeEditar = podeModulo(acesso.caps, "projetos", "EDITAR");
  const podeExcluir = podeModulo(acesso.caps, "projetos", "ADMIN");
  const { id } = await params;
  const r = await obterReuniao(id);
  if (!r) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={r.titulo}
        descricao={`${dataBR(r.data)}${r.cliente ? ` · ${r.cliente.nome}` : " · Interna"}`}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/reunioes"><ArrowLeft className="size-4" /> Atas</Link></Button>
            {podeEditar && <Button asChild variant="outline" size="sm"><Link href={`/reunioes/${r.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>}
            {podeExcluir && (
              <ConfirmButton action={excluirReuniao.bind(null, r.id)} variant="ghost" triggerIcon={<Trash2 className="size-4" />} triggerLabel="Excluir" titulo="Excluir ata?" descricao="Esta ação não pode ser desfeita." confirmarLabel="Excluir" />
            )}
          </div>
        }
      />

      {r.participantes && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Participantes</p>
            <p className="mt-1 text-sm">{r.participantes}</p>
          </CardContent>
        </Card>
      )}

      <Bloco titulo="Pauta" texto={r.pauta} />
      <Bloco titulo="Decisões" texto={r.decisoes} />
      <Bloco titulo="Próximos passos" texto={r.proximosPassos} />

      <Card>
        <CardHeader><CardTitle>Assistente de IA</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Gere um rascunho de ata organizada a partir da pauta e decisões acima.</p>
          <IaAssist acao={gerarAtaIA.bind(null, r.id)} rotulo="Gerar ata com IA" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="reuniao" entidadeId={r.id} /></CardContent>
      </Card>
    </div>
  );
}
