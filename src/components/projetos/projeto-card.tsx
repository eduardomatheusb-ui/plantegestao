import Link from "next/link";
import { CalendarClock, FolderTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { FavoritoButton } from "./favorito-button";
import { situacaoProjeto } from "@/lib/projetos/situacao";
import { TONE_BORDER, TONE_BADGE } from "@/lib/projetos/estilo";
import { iniciais } from "@/lib/format";
import { formatDate, cn } from "@/lib/utils";
import type { ProjetoStatus } from "@prisma/client";

type ProjetoCardData = {
  id: string;
  numero: number;
  nome: string;
  status: ProjetoStatus;
  prazoEstimado: Date | null;
  favorito: boolean;
  cliente: { nome: string; nomeFantasia: string | null } | null;
  responsavel: { nome: string } | null;
  _count: { subprojetos: number };
};

export function ProjetoCard({ projeto }: { projeto: ProjetoCardData }) {
  const situacao = situacaoProjeto(projeto);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-l-4 border-border bg-card p-4 shadow-sm transition-colors hover:border-brand-yellow",
        TONE_BORDER[situacao.tone],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/projetos/${projeto.id}`} className="min-w-0 flex-1 hover:underline">
          <p className="text-xs font-medium text-muted-foreground tabular-nums">#{projeto.numero}</p>
          <h3 className="font-display text-base font-semibold leading-tight">{projeto.nome}</h3>
        </Link>
        <FavoritoButton id={projeto.id} favorito={projeto.favorito} />
      </div>

      <p className="text-sm text-muted-foreground">
        {projeto.cliente?.nomeFantasia || projeto.cliente?.nome || "—"}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Badge variant={TONE_BADGE[situacao.tone]}>{situacao.label}</Badge>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {projeto._count.subprojetos > 0 && (
            <span className="inline-flex items-center gap-1" title="Subprojetos">
              <FolderTree className="size-3.5" />
              {projeto._count.subprojetos}
            </span>
          )}
          {projeto.prazoEstimado && (
            <span className="inline-flex items-center gap-1" title="Prazo estimado">
              <CalendarClock className="size-3.5" />
              {formatDate(projeto.prazoEstimado)}
            </span>
          )}
          {projeto.responsavel && (
            <span
              className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-bold"
              title={`Responsável: ${projeto.responsavel.nome}`}
            >
              {iniciais(projeto.responsavel.nome)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
