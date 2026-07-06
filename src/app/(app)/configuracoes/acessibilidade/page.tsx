import { requireUser } from "@/lib/rbac";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PainelAcessibilidade } from "@/components/acessibilidade/painel-acessibilidade";

export const metadata = { title: "Acessibilidade — TREM" };

export default async function AcessibilidadePage() {
  await requireUser();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Acessibilidade" descricao="Ajuste o sistema do jeito mais confortável para você." />
      <Card>
        <CardContent className="pt-6">
          <PainelAcessibilidade />
        </CardContent>
      </Card>
    </div>
  );
}
