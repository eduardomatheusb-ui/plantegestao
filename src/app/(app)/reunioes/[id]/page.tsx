import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Printer } from "lucide-react";
import { requireModulo, verTudoNoModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { podeModulo } from "@/lib/permissoes";
import { obterReuniao } from "@/lib/reunioes/queries";
import { excluirReuniao, salvarAtaTexto } from "@/lib/reunioes/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { HistoryPanel } from "@/components/shared/history-panel";
import { RichTextView } from "@/components/shared/rich-text-view";
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
      <CardContent><RichTextView texto={texto} className="text-sm" /></CardContent>
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
  // Recorte: sem ADMIN em projetos, só quem criou ou participa do compromisso da ata.
  if (!verTudoNoModulo(acesso, "projetos")) {
    const meu = await db.reuniao.findFirst({ where: { id, OR: [{ criadoPorId: acesso.id }, { compromisso: { participantes: { some: { usuarioId: acesso.id } } } }] }, select: { id: true } });
    if (!meu) notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={r.titulo}
        descricao={`${dataBR(r.data)}${r.cliente ? ` · ${r.cliente.nome}` : " · Interna"}`}
        acao={
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/reunioes"><ArrowLeft className="size-4" /> Atas</Link></Button>
            <Button asChild variant="outline" size="sm"><a href={`/imprimir/reuniao/${r.id}`} target="_blank" rel="noopener noreferrer"><Printer className="size-4" /> Imprimir / PDF</a></Button>
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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Ata</CardTitle>
          {podeEditar && (
            <Button asChild variant="ghost" size="sm"><Link href={`/reunioes/${r.id}/editar`}><Pencil className="size-4" /> Editar</Link></Button>
          )}
        </CardHeader>
        <CardContent>
          {r.ata ? (
            <RichTextView texto={r.ata} className="text-sm" />
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhuma ata escrita ainda. Clique em <strong>Editar</strong> para escrever do seu jeito, ou gere um rascunho com a IA abaixo e clique em <strong>Usar como ata</strong>.
            </p>
          )}
        </CardContent>
      </Card>

      <Bloco titulo="Pauta" texto={r.pauta} />
      <Bloco titulo="Decisões" texto={r.decisoes} />
      <Bloco titulo="Próximos passos" texto={r.proximosPassos} />

      <Card>
        <CardHeader><CardTitle>Assistente de IA</CardTitle></CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">Gere um rascunho de ata a partir da pauta e decisões acima. Você pode editar o texto e clicar em <strong>Usar como ata</strong> para gravá-lo, ou escrever a ata manualmente pelo botão Editar.</p>
          <IaAssist
            acao={gerarAtaIA.bind(null, r.id)}
            rotulo="Gerar ata com IA"
            onSalvar={podeEditar ? salvarAtaTexto.bind(null, r.id) : undefined}
            salvarRotulo="Usar como ata"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent><HistoryPanel entidadeTipo="reuniao" entidadeId={r.id} /></CardContent>
      </Card>
    </div>
  );
}
