"use client";

import Link from "next/link";
import { LogOut, ShieldCheck, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logoutAction } from "@/app/(app)/actions";
import { iniciais } from "@/lib/format";

export function UserMenu({
  nome,
  email,
  papelLabel,
  podeAdmin = false,
}: {
  nome?: string | null;
  email?: string | null;
  papelLabel: string;
  podeAdmin?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Abrir menu do usuário"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-ink-900">
          {iniciais(nome)}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate">{nome ?? "Usuário"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
          <span className="mt-1 text-xs font-normal text-muted-foreground">{papelLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/configuracoes/seguranca">
            <Lock className="size-4" />
            Segurança (2FA)
          </Link>
        </DropdownMenuItem>
        {podeAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/configuracoes">
              <ShieldCheck className="size-4" />
              Administração
            </Link>
          </DropdownMenuItem>
        )}
        <form action={logoutAction}>
          <button type="submit" className="w-full">
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
              <LogOut className="size-4" />
              Sair
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
