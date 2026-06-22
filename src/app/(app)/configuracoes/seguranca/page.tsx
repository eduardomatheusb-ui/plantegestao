import { requireUser } from "@/lib/rbac";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DoisFatores } from "@/components/seguranca/dois-fatores";
import { TrocarSenha } from "@/components/seguranca/trocar-senha";

export default async function SegurancaPage() {
  const user = await requireUser();
  const u = await db.usuario.findUnique({ where: { id: user.id }, select: { totpAtivo: true } });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader titulo="Segurança" descricao="Proteja o acesso à sua conta." />
      <Card>
        <CardHeader>
          <CardTitle>Trocar minha senha</CardTitle>
        </CardHeader>
        <CardContent>
          <TrocarSenha />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Verificação em duas etapas (2FA)</CardTitle>
        </CardHeader>
        <CardContent>
          <DoisFatores ativo={!!u?.totpAtivo} />
        </CardContent>
      </Card>
    </div>
  );
}
