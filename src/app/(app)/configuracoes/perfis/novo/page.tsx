import { requireModulo } from "@/lib/permissoes.server";
import { completarCaps } from "@/lib/permissoes";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PerfilForm } from "@/components/admin/perfil-form";

export default async function NovoPerfilPage() {
  await requireModulo("admin", "ADMIN");
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader titulo="Novo perfil de acesso" descricao="Defina o nome e o nível de acesso em cada módulo." />
      <Card>
        <CardContent className="pt-6">
          <PerfilForm id={null} inicial={{ nome: "", descricao: "", caps: completarCaps({}) }} />
        </CardContent>
      </Card>
    </div>
  );
}
