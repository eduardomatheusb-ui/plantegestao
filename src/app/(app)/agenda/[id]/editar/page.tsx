import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2, ArrowLeft, NotebookPen, MessageSquare } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { opcoesCompromisso, obterCompromisso } from "@/lib/agenda/queries";
import { excluirCompromisso } from "@/lib/agenda/actions";
import { criarAtaDeCompromisso } from "@/lib/reunioes/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { CommentsPanel } from "@/components/shared/comments-panel";
import { CompromissoForm, type CompromissoInicial } from "@/components/agenda/compromisso-form";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
const hm = (d: Date) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };

export default async function EditarCompromissoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [compromisso, opcoes, acesso] = await Promise.all([obterCompromisso(id), opcoesCompromisso(), acessoAtual()]);
  if (!compromisso) notFound();

  const podeEditar = compromisso.criadoPorId === user.id || podePapel(user.papel, "GESTOR");
  const podeVerAta = podeModulo(acesso.caps, "projetos", "VER");
  const podeCriarAta = podeModulo(acesso.caps, "projetos", "EDITAR");

  const inicial: CompromissoInicial = {
    titulo: compromisso.titulo,
    tipo: compromisso.tipo,
    data: ymd(compromisso.inicio),
    diaInteiro: compromisso.diaInteiro,
    horaInicio: compromisso.diaInteiro ? "" : hm(compromisso.inicio),
    horaFim: compromisso.fim && !compromisso.diaInteiro ? hm(compromisso.fim) : "",
    clienteId: compromisso.clienteId ?? "",
    local: compromisso.local ?? "",
    descricao: compromisso.descricao ?? "",
    participantes: compromisso.participantes.map((p) => p.usuario.id),
    recorrenciaDias: compromisso.recorrenciaDias ? String(compromisso.recorrenciaDias) : "",
    recorrenciaAte: compromisso.recorrenciaAte ? ymd(compromisso.recorrenciaAte) : "",
    emailsExternos: compromisso.emailsExternos ?? "",
  };

  const ehReuniao = compromisso.tipo === "reuniao";
  const ata = compromisso.reuniao;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo="Editar compromisso"
        descricao={compromisso.criadoPor ? `Criado por ${compromisso.criadoPor.nome}` : undefined}
        acao={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/agenda"><ArrowLeft className="size-4" /> Voltar</Link></Button>
            {podeEditar && (
              <ConfirmButton
                action={excluirCompromisso.bind(null, id)}
                titulo="Excluir compromisso?"
                descricao="Ele será removido da agenda de todo o time e do feed do Google/Apple. Não dá para desfazer."
                triggerLabel="Excluir"
                triggerIcon={<Trash2 className="size-4" />}
                confirmarLabel="Excluir"
              />
            )}
          </div>
        }
      />
      {ehReuniao && podeVerAta && (ata || podeCriarAta) && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><NotebookPen className="size-4" /> Ata desta reunião</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {ata ? "Esta reunião já tem uma ata registrada." : "Ainda não há ata. Crie uma já vinculada a esta reunião."}
            </p>
            {ata ? (
              <Button asChild variant="outline" size="sm"><Link href={`/reunioes/${ata.id}`}>Abrir ata</Link></Button>
            ) : (
              <form action={criarAtaDeCompromisso.bind(null, id)}>
                <Button type="submit" size="sm"><NotebookPen className="size-4" /> Criar ata</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      <CompromissoForm id={id} inicial={inicial} clientes={opcoes.clientes} usuarios={opcoes.usuarios} cancelHref="/agenda" />

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" /> Comentários</CardTitle></CardHeader>
        <CardContent><CommentsPanel entidadeTipo="compromisso" entidadeId={id} /></CardContent>
      </Card>
    </div>
  );
}
