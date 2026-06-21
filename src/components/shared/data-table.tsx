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
    <div className="rounded-lg border border-border">
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
  );
}
