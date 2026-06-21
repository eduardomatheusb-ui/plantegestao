"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { filtrarNav } from "./nav";
import type { Capacidades } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

export function Sidebar({ caps }: { caps: Capacidades }) {
  const pathname = usePathname();
  const grupos = filtrarNav(caps);

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-chrome text-chrome-foreground lg:flex">
      <div className="flex h-16 items-center border-b border-white-a10 px-5">
        <Link href="/dashboard" aria-label="Início">
          <Logo sub="Gestão" />
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Navegação principal">
        {grupos.map((grupo, i) => (
          <div key={i}>
            {grupo.titulo && (
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-chrome-foreground/40">
                {grupo.titulo}
              </p>
            )}
            <ul className="space-y-1">
              {grupo.itens.map((item) => {
                const Icon = item.icon;
                const ativo =
                  item.disponivel &&
                  (pathname === item.href || pathname.startsWith(item.href + "/"));

                if (!item.disponivel) {
                  return (
                    <li key={item.href}>
                      <span
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-chrome-foreground/35"
                        title="Em breve"
                      >
                        <Icon className="size-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[10px] uppercase tracking-wide">Em breve</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={ativo ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        ativo
                          ? "bg-brand-yellow font-semibold text-ink-900"
                          : "text-chrome-foreground/80 hover:bg-white-a10 hover:text-chrome-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
