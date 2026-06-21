"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { rotuloMes } from "@/lib/financeiro/constants";

export function MonthNav({ ano, mes }: { ano: number; mes: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(a: number, m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", String(a));
    params.set("mes", String(m));
    return `${pathname}?${params.toString()}`;
  }

  const prev = mes === 1 ? { a: ano - 1, m: 12 } : { a: ano, m: mes - 1 };
  const next = mes === 12 ? { a: ano + 1, m: 1 } : { a: ano, m: mes + 1 };

  return (
    <div className="flex items-center gap-3">
      <Link href={href(prev.a, prev.m)} aria-label="Mês anterior" className="rounded-md border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-44 text-center font-display text-lg font-bold tracking-tight">
        {rotuloMes(ano, mes)}
      </span>
      <Link href={href(next.a, next.m)} aria-label="Próximo mês" className="rounded-md border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
