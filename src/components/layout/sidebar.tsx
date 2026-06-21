"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { filtrarNav } from "./nav";
import type { Capacidades } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

const CHAVE = "plante-sidebar-colapsada";

export function Sidebar({ caps }: { caps: Capacidades }) {
  const pathname = usePathname();
  const grupos = filtrarNav(caps);
  const [colapsada, setColapsada] = React.useState(false);

  React.useEffect(() => {
    setColapsada(localStorage.getItem(CHAVE) === "1");
  }, []);

  function alternar() {
    setColapsada((v) => {
      const nova = !v;
      localStorage.setItem(CHAVE, nova ? "1" : "0");
      return nova;
    });
  }

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col bg-chrome text-chrome-foreground transition-[width] duration-200 lg:flex",
        colapsada ? "w-16" : "w-64",
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-white-a10", colapsada ? "justify-center px-2" : "px-5")}>
        <Link href="/dashboard" aria-label="Início">
          {colapsada ? <LogoMark tom="escuro" className="h-8" /> : <Logo sub="Gestão" />}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
        {grupos.map((grupo, i) => (
          <div key={i}>
            {grupo.titulo && !colapsada && (
              <p
                className={cn(
                  "px-3 pb-2 text-xs font-semibold uppercase tracking-wider",
                  grupo.destaque ? "text-brand-yellow" : "text-chrome-foreground/40",
                )}
              >
                {grupo.titulo}
              </p>
            )}
            {grupo.titulo && colapsada && i > 0 && <div className="mx-2 mb-2 border-t border-white-a10" />}
            <ul className="space-y-1">
              {grupo.itens.map((item) => {
                const Icon = item.icon;
                const ativo =
                  item.disponivel && (pathname === item.href || pathname.startsWith(item.href + "/"));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={ativo ? "page" : undefined}
                      title={colapsada ? item.label : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md py-2 text-sm transition-colors",
                        colapsada ? "justify-center px-2" : "px-3",
                        ativo
                          ? "bg-brand-yellow font-semibold text-ink-900"
                          : "text-chrome-foreground/80 hover:bg-white-a10 hover:text-chrome-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {!colapsada && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={alternar}
        aria-label={colapsada ? "Expandir menu" : "Recolher menu"}
        className={cn(
          "flex h-12 items-center gap-2 border-t border-white-a10 text-sm text-chrome-foreground/60 transition-colors hover:bg-white-a10 hover:text-chrome-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-yellow",
          colapsada ? "justify-center px-2" : "px-5",
        )}
      >
        {colapsada ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
        {!colapsada && <span>Recolher menu</span>}
      </button>
    </aside>
  );
}
