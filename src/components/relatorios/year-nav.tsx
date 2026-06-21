"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function YearNav({ ano }: { ano: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(a: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", String(a));
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex items-center gap-3">
      <Link href={href(ano - 1)} aria-label="Ano anterior" className="rounded-md border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronLeft className="size-4" />
      </Link>
      <span className="min-w-20 text-center font-display text-lg font-bold tabular-nums">{ano}</span>
      <Link href={href(ano + 1)} aria-label="Próximo ano" className="rounded-md border border-border p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <ChevronRight className="size-4" />
      </Link>
    </div>
  );
}
