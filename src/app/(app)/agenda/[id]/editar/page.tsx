import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2, ArrowLeft } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { opcoesCompromisso, obterCompromisso } from "@/lib/agenda/queries";
import { excluirCompromisso } from "@/lib/agenda/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { CompromissoForm, type CompromissoInicial } from "@/components/agenda/compromisso-form";

export const dynamic = "force-dynamic";

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
const hm = (d: Date) => { const x = new Date(d); return `${pad(x.getHours())}:${pad(x.getMinutes())}`; };

export default async function EditarCompromissoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [compromisso, opcoes] = await Promise.all([obterCompromisso(id), opcoesCompromisso()]);
  if (!compromisso) notFound();

  const podeEditar = compromisso.criadoPorId === user.id || podePapel(user.papel, "GESTOR");

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
  };

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
      <CompromissoForm id={id} inicial={inicial} clientes={opcoes.clientes} usuarios={opcoes.usuarios} cancelHref="/agenda" />
    </div>
  );
}
