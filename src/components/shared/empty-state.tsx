import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  titulo = "Nada por aqui ainda",
  descricao,
  acao,
  className,
}: {
  titulo?: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center",
        className,
      )}
    >
      <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{titulo}</p>
        {descricao && <p className="text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
}
