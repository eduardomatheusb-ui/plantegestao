import { Trash2 } from "lucide-react";
import { removerGrade } from "@/lib/midia/actions";
import { diasNoMes } from "@/lib/midia/constants";
import { MESES } from "@/lib/financeiro/constants";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { MatrizLinha } from "./matriz-linha";
import { LinhaAddForm } from "./add-forms";

type Linha = {
  id: string;
  programaNome: string | null;
  formato: string | null;
  valorInsercao: unknown;
  peca: { codigo: string; nome: string } | null;
  insercoes: { dia: number; quantidade: number }[];
};

type Grade = {
  id: string;
  pracaNome: string | null;
  ano: number;
  mes: number;
  linhas: Linha[];
};

export function GradeCard({
  grade,
  pecas,
  podeEditar,
}: {
  grade: Grade;
  pecas: { id: string; codigo: string; nome: string }[];
  podeEditar: boolean;
}) {
  const dias = diasNoMes(grade.ano, grade.mes);
  const diasArr = Array.from({ length: dias }, (_, i) => i + 1);

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between gap-2 border-b border-border p-3">
        <p className="text-sm font-semibold">
          {grade.pracaNome ?? "Praça —"} · <span className="capitalize">{MESES[grade.mes - 1]}</span> {grade.ano}
        </p>
        {podeEditar && (
          <ConfirmButton
            action={removerGrade.bind(null, grade.id)}
            variant="ghost"
            triggerIcon={<Trash2 className="size-4" />}
            triggerLabel="Remover grade"
            titulo="Remover esta grade?"
            descricao="Remove as linhas e inserções desta grade."
            confirmarLabel="Remover"
          />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 min-w-40 border-r border-border bg-muted/60 p-2 text-left font-medium">
                Peça / Programa
              </th>
              {diasArr.map((d) => (
                <th key={d} className="w-9 border-r border-border/50 bg-muted/40 p-1 text-center font-medium text-muted-foreground">
                  {d}
                </th>
              ))}
              <th className="bg-muted/60 px-2 text-center font-medium">Total</th>
              {podeEditar && <th className="bg-muted/60" />}
            </tr>
          </thead>
          <tbody>
            {grade.linhas.length === 0 ? (
              <tr>
                <td colSpan={dias + 2} className="p-4 text-center text-muted-foreground">
                  Sem linhas. Adicione peça × programa × formato abaixo.
                </td>
              </tr>
            ) : (
              grade.linhas.map((l) => {
                const insercoes: Record<number, number> = {};
                for (const ins of l.insercoes) insercoes[ins.dia] = ins.quantidade;
                return (
                  <MatrizLinha
                    key={l.id}
                    dias={dias}
                    insercoes={insercoes}
                    linha={{
                      id: l.id,
                      pecaCodigo: l.peca?.codigo ?? null,
                      pecaNome: l.peca?.nome ?? null,
                      programaNome: l.programaNome,
                      formato: l.formato,
                      valorInsercao: Number(l.valorInsercao),
                    }}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {podeEditar && <LinhaAddForm gradeId={grade.id} pecas={pecas} />}
    </div>
  );
}
