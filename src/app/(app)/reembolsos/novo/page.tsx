import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { ReembolsoNovoForm } from "@/components/reembolsos/reembolso-novo-form";

export default async function NovoReembolsoPage() {
  await requireUser();
  const hoje = new Date();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Novo pedido de reembolso" descricao="Escolha o mês de competência das despesas." />
      <Card>
        <CardContent className="pt-6">
          <ReembolsoNovoForm anoAtual={hoje.getFullYear()} mesAtual={hoje.getMonth() + 1} />
        </CardContent>
      </Card>
    </div>
  );
}
