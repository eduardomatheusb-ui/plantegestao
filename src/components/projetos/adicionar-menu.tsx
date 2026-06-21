"use client";

import Link from "next/link";
import { Plus, ListChecks, FileText, Megaphone, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AdicionarMenu({ projetoId }: { projetoId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Adicionar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem asChild>
          <Link href={`/jobs/novo?projeto=${projetoId}`}>
            <ListChecks className="size-4" />
            Job
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/propostas/novo?projeto=${projetoId}`}>
            <FileText className="size-4" />
            Proposta
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/midia/novo?projeto=${projetoId}`}>
            <Megaphone className="size-4" />
            Mídia
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/financeiro/novo?tipo=RECEITA&projeto=${projetoId}`}>
            <TrendingUp className="size-4" />
            Receita
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/financeiro/novo?tipo=DESPESA&projeto=${projetoId}`}>
            <TrendingDown className="size-4" />
            Despesa
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/projetos/novo?pai=${projetoId}`}>
            <Plus className="size-4" />
            Subprojeto
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
