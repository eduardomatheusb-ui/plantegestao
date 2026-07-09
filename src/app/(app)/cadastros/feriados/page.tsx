import { Trash2, CalendarOff } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { acessoAtual } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { excluirFeriado } from "@/lib/feriados/actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/shared/confirm-button";
import { FeriadoForm } from "@/components/cadastros/feriado-form";

export const dynamic = "force-dynamic";

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" }).format(d);
}

export default async function FeriadosPage() {
  await requireModulo("cadastros", "VER");
  const acesso = await acessoAtual();
  const podeEditar = podeModulo(acesso.caps, "cadastros", "EDITAR");
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const feriados = await db.feriado.findMany({ orderBy: { data: "asc" } });
  const futuros = feriados.filter((f) => f.data >= hoje);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        titulo="Feriados"
        descricao="Datas consideradas no cálculo de prazos em “dias úteis” (adiamento de prazo dos jobs)."
      />

      {podeEditar && (
        <Card>
          <CardHeader><CardTitle className="text-base">Novo feriado</CardTitle></CardHeader>
          <CardContent><FeriadoForm /></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Cadastrados ({feriados.length})</CardTitle></CardHeader>
        <CardContent>
          {feriados.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarOff className="size-4" /> Nenhum feriado cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {feriados.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium capitalize">{dataBR(f.data)}</p>
                    <p className="text-xs text-muted-foreground">{f.nome}{f.data < hoje && " · passado"}</p>
                  </div>
                  {podeEditar && (
                    <ConfirmButton
                      action={excluirFeriado.bind(null, f.id)}
                      variant="ghost"
                      triggerIcon={<Trash2 className="size-4" />}
                      triggerLabel=""
                      titulo="Excluir feriado?"
                      descricao={`Remover “${f.nome}” (${dataBR(f.data)}) do cálculo de dias úteis.`}
                      confirmarLabel="Excluir"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {futuros.length === 0 && feriados.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Todos os feriados cadastrados já passaram — cadastre os próximos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
