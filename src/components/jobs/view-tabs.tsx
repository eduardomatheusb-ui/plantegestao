"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const VIEWS = [
  { key: "minha-pauta", label: "Minha pauta" },
  { key: "lista", label: "Lista" },
  { key: "kanban-status", label: "Kanban por status" },
  { key: "kanban-resp", label: "Por responsável" },
  { key: "timeline", label: "Timeline" },
];

export function ViewTabs({ atual }: { atual: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function href(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    return `${pathname}?${params.toString()}`;
  }

  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1" role="tablist">
      {VIEWS.map((v) => {
        const ativo = v.key === atual;
        return (
          <Link
            key={v.key}
            href={href(v.key)}
            role="tab"
            aria-selected={ativo}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              ativo ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {v.label}
          </Link>
        );
      })}
    </div>
  );
}
