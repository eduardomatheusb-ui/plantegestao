import { requireUser, PAPEL_LABEL } from "@/lib/rbac";
import { carregarAcesso } from "@/lib/permissoes.server";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const acesso = await carregarAcesso(user.id);

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
        />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
