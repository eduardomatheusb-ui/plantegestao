"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Logo } from "@/components/brand/logo";
import { NAV } from "./nav";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const [aberto, setAberto] = React.useState(false);

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
          <Logo sub="Gestão" />
        </DialogTitle>
        <nav className="space-y-6 overflow-y-auto px-3 py-4">
          {NAV.map((grupo, i) => (
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
            </div>
          ))}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
