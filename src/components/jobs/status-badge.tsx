import { cn } from "@/lib/utils";

/** Pílula de status do job com a cor configurada (ponto colorido + nome). */
export function StatusBadge({
  status,
  className,
}: {
  status: { nome: string; cor: string | null };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
    >
      <span
        className="size-2 shrink-0 rounded-full"
        style={{ backgroundColor: status.cor ?? "var(--muted-foreground)" }}
        aria-hidden="true"
      />
      {status.nome}
    </span>
  );
}
