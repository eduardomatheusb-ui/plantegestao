import { Logo } from "@/components/brand/logo";
import { BuscaGlobal } from "./busca-global";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import { NotificacoesBell, type NotificacaoItem } from "./notificacoes-bell";
import type { Capacidades } from "@/lib/permissoes";

export function Topbar({
  nome,
  email,
  papelLabel,
  podeAdmin,
  caps,
  naoLidas,
  recentes,
}: {
  nome?: string | null;
  email?: string | null;
  papelLabel: string;
  podeAdmin?: boolean;
  caps: Capacidades;
  naoLidas: number;
  recentes: NotificacaoItem[];
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <MobileNav caps={caps} />
      <div className="lg:hidden">
        <Logo showWordmark={false} tom="claro" />
      </div>

      {/* Busca global unificada (projetos, jobs, propostas, mídia, OS, clientes) */}
      <BuscaGlobal />

      <div className="ml-auto flex items-center gap-1">
        <NotificacoesBell naoLidas={naoLidas} recentes={recentes} />
        <ThemeToggle />
        <UserMenu nome={nome} email={email} papelLabel={papelLabel} podeAdmin={podeAdmin} />
      </div>
    </header>
  );
}
