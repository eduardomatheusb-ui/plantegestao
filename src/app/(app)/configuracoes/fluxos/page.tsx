import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { TIPOS_JOB } from "@/lib/jobs/tipos";
import { fluxoDoTipo } from "@/lib/jobs/fluxos";
import { AREA_PADRAO } from "@/lib/jobs/corresponsaveis";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const metadata = { title: "Fluxos de trabalho — Administração" };

export default async function FluxosPage() {
  await requireModulo("admin", "ADMIN");

  const [fluxos, areas] = await Promise.all([
    db.tipoJobFluxo.findMany({ select: { tipo: true, etapas: true } }),
    db.tipoJobArea.findMany({ select: { tipo: true, funcoes: true } }),
  ]);
  const porTipoFluxo = new Map(fluxos.map((f) => [f.tipo, f.etapas]));
  const porTipoArea = new Map(areas.map((a) => [a.tipo, a.funcoes]));

  const linhas = TIPOS_JOB.map((t) => {
    const salvo = porTipoFluxo.get(t.key);
    const personalizado = salvo !== undefined;
    let etapas: string[] = fluxoDoTipo(t.key);
    if (personalizado) {
      try {
        const arr: unknown = JSON.parse(salvo);
        etapas = Array.isArray(arr) ? arr.map(String) : [];
      } catch {
        etapas = [];
      }
    }
    const areaSalva = porTipoArea.get(t.key);
    const termos = areaSalva ? areaSalva.split(",").map((s) => s.trim()).filter(Boolean) : (AREA_PADRAO[t.key] ?? []);
    return { ...t, etapas, personalizado, termos };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Fluxos de trabalho"
        descricao="As etapas que nascem junto com cada tipo de job — e quem entra automaticamente como corresponsável."
        acao={<Button asChild variant="outline"><Link href="/configuracoes"><ArrowLeft className="size-4" />Administração</Link></Button>}
      />

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            Quando alguém cria um job, o sistema já monta as <strong>etapas</strong> daquele tipo — é o roteiro que a
            equipe vai marcando conforme entrega. Aqui você muda esse roteiro sem precisar de programador.
          </p>
          <p className="mt-2">
            Quem nunca foi mexido fica como <Badge variant="outline">padrão</Badge>. Alterar aqui vale para os
            <strong> próximos jobs</strong> — os jobs já criados não mudam sozinhos.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de job</TableHead>
                <TableHead>Etapas que nascem com o job</TableHead>
                <TableHead>Entra automático</TableHead>
                <TableHead className="text-right">Editar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.key}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.cor }} />
                      <span className="font-medium">{l.label}</span>
                      {l.personalizado
                        ? <Badge variant="success">personalizado</Badge>
                        : <Badge variant="outline">padrão</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.etapas.length === 0 ? "— nenhuma —" : `${l.etapas.length}: ${l.etapas.join(" › ")}`}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {l.termos.length === 0 ? "—" : l.termos.join(", ")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/configuracoes/fluxos/${l.key}`}><Pencil className="size-3.5" />Editar</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
