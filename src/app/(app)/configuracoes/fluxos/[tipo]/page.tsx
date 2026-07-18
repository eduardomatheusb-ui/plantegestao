import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { requireModulo } from "@/lib/permissoes.server";
import { db } from "@/lib/db";
import { TIPOS_JOB } from "@/lib/jobs/tipos";
import { fluxoDoTipo } from "@/lib/jobs/fluxos";
import { etapasDoTipo, funcoesDaArea, pessoasDaArea } from "@/lib/jobs/config";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineAction } from "@/components/shared/inline-action";
import { FluxoForm } from "@/components/configuracoes/fluxo-form";
import { voltarAoPadrao } from "../actions";

export default async function EditarFluxoPage({ params }: { params: Promise<{ tipo: string }> }) {
  await requireModulo("admin", "ADMIN");
  const { tipo } = await params;

  const meta = TIPOS_JOB.find((t) => t.key === tipo);
  if (!meta) notFound();

  const [etapas, termos, salvo, colaboradores] = await Promise.all([
    etapasDoTipo(tipo),
    funcoesDaArea(tipo),
    db.tipoJobFluxo.findUnique({ where: { tipo }, select: { tipo: true } }),
    db.colaborador.findMany({
      where: { ativo: true, usuarioId: { not: null }, usuario: { is: { ativo: true } } },
      select: { nome: true, funcao: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const pessoas = await pessoasDaArea(termos);
  const personalizado = salvo !== null;

  // Funções distintas disponíveis para marcar (as que existem no cadastro).
  const funcoesDisponiveis = [...new Set(colaboradores.map((c) => (c.funcao ?? "").trim()).filter(Boolean))].sort();
  // Termos digitados à mão = os que não estão entre as funções cadastradas.
  const extras = termos.filter((t) => !funcoesDisponiveis.some((f) => f.toLowerCase() === t.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo={meta.label}
        descricao="Etapas que nascem com o job e quem entra automaticamente como corresponsável."
        acao={
          <div className="flex flex-wrap gap-2">
            {personalizado && (
              <InlineAction action={voltarAoPadrao.bind(null, tipo)} title="Descartar a personalização e voltar ao padrão de fábrica">
                <span className="inline-flex items-center gap-1.5 text-sm"><RotateCcw className="size-4" />Voltar ao padrão</span>
              </InlineAction>
            )}
            <Button asChild variant="outline"><Link href="/configuracoes/fluxos"><ArrowLeft className="size-4" />Fluxos</Link></Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <span className="inline-block size-3 rounded-full" style={{ backgroundColor: meta.cor }} />
        {personalizado
          ? <Badge variant="success">personalizado</Badge>
          : <Badge variant="outline">usando o padrão de fábrica</Badge>}
        {meta.social && <Badge variant="outline">peça de social</Badge>}
      </div>

      <FluxoForm
        tipo={tipo}
        etapas={etapas}
        padrao={fluxoDoTipo(tipo)}
        funcoesDisponiveis={funcoesDisponiveis}
        marcadas={termos}
        extras={extras}
      />

      <Card>
        <CardHeader><CardTitle className="text-base">Quem entra hoje neste tipo</CardTitle></CardHeader>
        <CardContent>
          {pessoas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguém — nenhuma função marcada, ou ninguém no cadastro tem função compatível.
            </p>
          ) : (
            <ul className="space-y-1 text-sm">
              {pessoas.map((p) => (
                <li key={p.nome}>
                  <strong>{p.nome}</strong> <span className="text-muted-foreground">— {p.funcao}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Esta lista é calculada na hora, pela <strong>função</strong> de cada pessoa em Cadastros → Colaboradores.
            Se alguém mudar de função, entra ou sai daqui sozinho — você não precisa voltar nesta tela.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
