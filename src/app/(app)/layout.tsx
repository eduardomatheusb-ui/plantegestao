import { requireUser, PAPEL_LABEL } from "@/lib/rbac";
import { carregarAcesso } from "@/lib/permissoes.server";
import { contarNaoLidas, listarNotificacoes } from "@/lib/notificacoes";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [acesso, naoLidas, recentes] = await Promise.all([
    carregarAcesso(user.id),
    contarNaoLidas(user.id),
    listarNotificacoes(user.id, 6),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar caps={acesso.caps} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          nome={user.name}
          email={user.email}
          papelLabel={PAPEL_LABEL[acesso.papel]}
          podeAdmin={acesso.admin}
          caps={acesso.caps}
          naoLidas={naoLidas}
          recentes={recentes}
        />
        <Breadcrumbs />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
