import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

export type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  headClassName?: string;
};

/**
 * Tabela genérica e reutilizável (server-friendly).
 * No desktop: tabela. No celular: cada linha vira um card empilhado
 * (rótulo + valor), porque tabela larga é ruim de usar no toque.
 * Renderiza um EmptyState quando não há linhas.
 */
export function DataTable<T extends { id: string }>({
  columns,
  rows,
  vazio,
}: {
  columns: Column<T>[];
  rows: T[];
  vazio?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return <>{vazio ?? <EmptyState />}</>;
  }

  return (
    <>
      {/* Desktop / tablet: tabela */}
      <div className="hidden rounded-lg border border-border sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead key={i} className={col.headClassName}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col, i) => (
                  <TableCell key={i} className={cn(col.className)}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Celular: cards empilhados */}
      <div className="space-y-2 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-lg border border-border bg-card p-3">
            {columns.map((col, i) => {
              const temRotulo = col.header.trim().length > 0;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between gap-3 py-1",
                    temRotulo ? "border-b border-border/50 last:border-0" : "pt-2",
                  )}
                >
                  {temRotulo && (
                    <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {col.header}
                    </span>
                  )}
                  <span className={cn("min-w-0 text-sm", temRotulo ? "text-right" : "flex w-full justify-end")}>
                    {col.cell(row)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
