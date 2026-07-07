import { requireUser } from "@/lib/rbac";
import { opcoesCompromisso } from "@/lib/agenda/queries";
import { PageHeader } from "@/components/shared/page-header";
import { CompromissoForm } from "@/components/agenda/compromisso-form";

export const dynamic = "force-dynamic";

export default async function NovoCompromissoPage() {
  await requireUser();
  const { clientes, usuarios } = await opcoesCompromisso();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo compromisso" descricao="Agende uma reunião, gravação, visita ou prazo. Todo o time vê na agenda." />
      <CompromissoForm id={null} clientes={clientes} usuarios={usuarios} cancelHref="/agenda" />
    </div>
  );
}
