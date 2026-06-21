import { Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "./user-menu";
import { MobileNav } from "./mobile-nav";
import type { Capacidades } from "@/lib/permissoes";

export function Topbar({
  nome,
  email,
  papelLabel,
  podeAdmin,
  caps,
}: {
  nome?: string | null;
  email?: string | null;
  papelLabel: string;
  podeAdmin?: boolean;
  caps: Capacidades;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background px-4 lg:px-6">
      <MobileNav caps={caps} />
      <div className="lg:hidden">
        <Logo showWordmark={false} tom="claro" />
      </div>

      {/* Busca global (stub — ganha função em fase futura) */}
      <div className="relative flex-1 lg:max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="busca-global" className="sr-only">
          Buscar
        </label>
        <input
          id="busca-global"
          type="search"
          placeholder="Buscar… (em breve)"
          disabled
          className="h-9 w-full rounded-md border border-input bg-muted/40 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu nome={nome} email={email} papelLabel={papelLabel} podeAdmin={podeAdmin} />
      </div>
    </header>
  );
}
