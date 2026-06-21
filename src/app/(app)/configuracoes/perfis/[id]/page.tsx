import { notFound } from "next/navigation";
import { requireModulo } from "@/lib/permissoes.server";
import { obterPerfil } from "@/lib/admin/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { PerfilForm } from "@/components/admin/perfil-form";

export default async function EditarPerfilPage({ params }: { params: Promise<{ id: string }> }) {
  await requireModulo("admin", "ADMIN");
  const { id } = await params;
  const perfil = await obterPerfil(id);
  if (!perfil) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        titulo={`Editar perfil — ${perfil.nome}`}
        descricao={perfil.sistema ? "Perfil-base do sistema: pode ser ajustado, mas não excluído." : "Ajuste o nome e as permissões."}
      />
      <Card>
        <CardContent className="pt-6">
          <PerfilForm id={perfil.id} inicial={{ nome: perfil.nome, descricao: perfil.descricao, caps: perfil.caps }} />
        </CardContent>
      </Card>
    </div>
  );
}
