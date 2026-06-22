"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Logo } from "@/components/brand/logo";
import { filtrarNav, type NavGroup } from "./nav";
import type { Capacidades } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

function grupoTemRotaAtiva(grupo: NavGroup, pathname: string) {
  return grupo.itens.some((i) => i.disponivel && (pathname === i.href || pathname.startsWith(i.href + "/")));
}

export function MobileNav({ caps }: { caps: Capacidades }) {
  const pathname = usePathname();
  const [aberto, setAberto] = React.useState(false);
  const grupos = filtrarNav(caps);

  const [gruposAbertos, setGruposAbertos] = React.useState<Record<string, boolean>>(() => {
    const inicial: Record<string, boolean> = {};
    for (const g of grupos) if (g.titulo) inicial[g.titulo] = grupoTemRotaAtiva(g, pathname);
    return inicial;
  });

  function alternarGrupo(titulo: string) {
    setGruposAbertos((atual) => ({ ...atual, [titulo]: !atual[titulo] }));
  }

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger
        className="rounded-md p-2 text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
        aria-label="Abrir menu de navegação"
      >
        <Menu className="size-5" />
      </DialogTrigger>
      <DialogContent className="left-0 top-0 h-full max-w-[17rem] translate-x-0 translate-y-0 rounded-none bg-chrome p-0 text-chrome-foreground sm:rounded-none">
        <DialogTitle className="flex h-16 items-center border-b border-white-a10 px-5">
          <Logo />
        </DialogTitle>
        <nav className="space-y-2 overflow-y-auto px-3 py-4">
          {grupos.map((grupo, i) => {
            const temTitulo = !!grupo.titulo;
            const grupoAberto = !temTitulo || gruposAbertos[grupo.titulo!];
            const listaId = `mnav-grupo-${i}`;
            return (
            <div key={i} className={cn(temTitulo && "border-b border-white-a10/50 pb-2")}>
              {temTitulo && (
                <button
                  type="button"
                  onClick={() => alternarGrupo(grupo.titulo!)}
                  aria-expanded={grupoAberto}
                  aria-controls={listaId}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-white-a10",
                    grupo.destaque ? "text-brand-yellow" : "text-chrome-foreground/50",
                  )}
                >
                  <span>{grupo.titulo}</span>
                  <ChevronDown className={cn("size-3.5 transition-transform", grupoAberto ? "" : "-rotate-90")} aria-hidden="true" />
                </button>
              )}
              {grupoAberto && (
              <ul id={listaId} className={cn("space-y-1", temTitulo && "mt-1")}>
                {grupo.itens.map((item) => {
                  const Icon = item.icon;
                  const ativo =
                    item.disponivel &&
                    (pathname === item.href || pathname.startsWith(item.href + "/"));
                  if (!item.disponivel) {
                    return (
                      <li
                        key={item.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-chrome-foreground/35"
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {item.label}
                      </li>
                    );
                  }
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setAberto(false)}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                          ativo
                            ? "bg-brand-yellow font-semibold text-ink-900"
                            : "text-chrome-foreground/80 hover:bg-white-a10",
                        )}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
