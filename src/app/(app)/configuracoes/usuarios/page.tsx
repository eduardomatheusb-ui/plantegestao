import { requireModulo, acessoAtual } from "@/lib/permissoes.server";
import { listarUsuarios, perfisParaSelect, colaboradoresSemUsuario, colaboradoresVinculaveis } from "@/lib/admin/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UsuarioAdd } from "@/components/admin/usuario-add";
import { UsuarioAcoes } from "@/components/admin/usuario-acoes";

export default async function UsuariosPage() {
  await requireModulo("admin", "ADMIN");
  const [usuarios, perfis, colaboradores, colaboradoresVinc, eu] = await Promise.all([
    listarUsuarios(),
    perfisParaSelect(),
    colaboradoresSemUsuario(),
    colaboradoresVinculaveis(),
    acessoAtual(),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        titulo="Usuários"
        descricao="Quem tem acesso ao sistema. Convide a partir de um colaborador, defina o perfil e gerencie o acesso."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <UsuarioAdd colaboradores={colaboradores} perfis={perfis} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {usuarios.map((u) => (
              <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{u.nome}</span>
                    {u.responsavelConta && <Badge variant="secondary">Responsável</Badge>}
                    {!u.ativo && <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>}
                    {u.ativo && u.convitePendente && (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300">
                        Convite pendente
                      </Badge>
                    )}
                    {u.ativo && !u.convitePendente && (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {u.email}{u.funcao ? ` · ${u.funcao}` : ""}
                  </p>
                </div>

                <UsuarioAcoes
                  usuarioId={u.id}
                  nome={u.nome}
                  email={u.email}
                  perfilIdAtual={u.perfilId}
                  perfis={perfis}
                  ativo={u.ativo}
                  convitePendente={u.convitePendente}
                  ehProprio={u.id === eu.id}
                  responsavelConta={u.responsavelConta}
                  colaboradorId={u.colaboradorId}
                  colaboradores={colaboradoresVinc}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
