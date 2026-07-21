import { requireModulo } from "@/lib/permissoes.server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopiarPacote } from "@/components/agentes/copiar-pacote";
import { montarPacoteOperacoes, type JobLinha } from "@/lib/agentes/operacoes";

export const dynamic = "force-dynamic";

function dataCurta(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Bloco de uma lista de jobs. Não renderiza nada quando está vazia. */
function BlocoJobs({
  titulo,
  descricao,
  linhas,
  total,
  tom = "muted",
}: {
  titulo: string;
  descricao: string;
  linhas: JobLinha[];
  total: number;
  tom?: "destructive" | "warning" | "muted";
}) {
  if (total === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{titulo}</CardTitle>
          <Badge variant={tom}>{total}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Job</th>
                <th className="py-2 pr-3 font-medium">Cliente</th>
                <th className="py-2 pr-3 font-medium">Responsável</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Prazo interno</th>
                <th className="py-2 font-medium">Evidência</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={`${titulo}-${l.numero}`} className="border-b border-border/50 last:border-0">
                  <td className="py-2 pr-3 align-top">
                    <span className="text-muted-foreground">#{l.numero}</span> {l.titulo}
                  </td>
                  <td className="py-2 pr-3 align-top">{l.cliente}</td>
                  <td className="py-2 pr-3 align-top">
                    {l.responsavel ?? <span className="text-destructive">sem responsável</span>}
                  </td>
                  <td className="py-2 pr-3 align-top text-muted-foreground">{l.status}</td>
                  <td className="py-2 pr-3 align-top whitespace-nowrap">{dataCurta(l.prazo)}</td>
                  <td className="py-2 align-top text-muted-foreground">{l.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > linhas.length && (
          <p className="pt-3 text-xs text-muted-foreground">
            Mostrando {linhas.length} de {total}. O pacote completo tem todos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AgenteOperacoesPage() {
  await requireModulo("admin", "ADMIN");

  const p = await montarPacoteOperacoes();
  const json = JSON.stringify(p, null, 2);
  const r = p.resumo;

  const indicadores: { rotulo: string; valor: number; tom: "destructive" | "warning" | "muted" }[] = [
    { rotulo: "Jobs abertos", valor: r.jobsAbertos, tom: "muted" },
    { rotulo: "Atrasados", valor: r.atrasados, tom: "destructive" },
    { rotulo: "Vencendo", valor: r.vencendo, tom: "warning" },
    { rotulo: "Postagem atrasada", valor: r.postagemAtrasada, tom: "destructive" },
    { rotulo: "Falta marcar publicado", valor: r.postagemNaoMarcada, tom: "warning" },
    { rotulo: "Sem responsável", valor: r.semResponsavel, tom: "destructive" },
    { rotulo: "Bloqueados", valor: r.bloqueados, tom: "warning" },
    { rotulo: "Cliente não respondeu", valor: r.aguardandoCliente, tom: "warning" },
    { rotulo: "Parados", valor: r.semAtualizacao, tom: "warning" },
    { rotulo: "Briefing fraco", valor: r.briefingFraco, tom: "warning" },
    { rotulo: "Remarcados", valor: r.remarcados, tom: "warning" },
    { rotulo: "Escopo estourado", valor: r.escopoEstourado, tom: "destructive" },
    { rotulo: "Reajuste atrasado", valor: r.reajustesAtrasados, tom: "destructive" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Agente de Operações — pacote de dados"
        descricao="Fase 0: o material bruto que seria entregue à IA para escrever o resumo da direção. Ainda sem IA — se o pacote estiver errado, nenhum texto conserta."
      />

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
          <span className="text-muted-foreground">
            Gerado em {new Date(p.geradoEm).toLocaleString("pt-BR")} · janelas: vence em {p.janelas.vencendoEmDias}{" "}
            dia(s), cliente calado há {p.janelas.aprovacaoParadaDiasUteis} dia útil, job parado há{" "}
            {p.janelas.semAtualizacaoDiasUteis} dias úteis
          </span>
          <CopiarPacote json={json} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {indicadores.map((i) => (
          <Card key={i.rotulo}>
            <CardContent className="p-4">
              <div
                className={
                  i.valor === 0
                    ? "font-display text-2xl font-semibold text-muted-foreground"
                    : i.tom === "destructive"
                      ? "font-display text-2xl font-semibold text-destructive"
                      : "font-display text-2xl font-semibold"
                }
              >
                {i.valor}
              </div>
              <div className="text-xs text-muted-foreground">{i.rotulo}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <BlocoJobs
        titulo="Atrasados"
        descricao="Prazo interno já venceu e o job continua aberto."
        linhas={p.atrasados}
        total={r.atrasados}
        tom="destructive"
      />
      <BlocoJobs
        titulo="Postagem atrasada"
        descricao="Data de ir ao ar passou e alguém mexeu no job depois — o atraso tende a ser real."
        linhas={p.postagemAtrasada}
        total={r.postagemAtrasada}
        tom="destructive"
      />
      <BlocoJobs
        titulo="Falta marcar como publicado"
        descricao="A data passou e ninguém tocou no job desde antes dela. Quase sempre é marcação que faltou, não peça que deixou de ir ao ar — por isso está separado do atraso de verdade."
        linhas={p.postagemNaoMarcada}
        total={r.postagemNaoMarcada}
        tom="warning"
      />
      <BlocoJobs
        titulo="Sem responsável"
        descricao="Job aberto que não é de ninguém."
        linhas={p.semResponsavel}
        total={r.semResponsavel}
        tom="destructive"
      />
      <BlocoJobs
        titulo="Vencendo"
        descricao={`Prazo interno vence em até ${p.janelas.vencendoEmDias} dia(s).`}
        linhas={p.vencendo}
        total={r.vencendo}
        tom="warning"
      />
      <BlocoJobs
        titulo="Cliente não respondeu"
        descricao="Enviado para aprovação e sem resposta dentro da janela."
        linhas={p.aguardandoCliente}
        total={r.aguardandoCliente}
        tom="warning"
      />
      <BlocoJobs
        titulo="Bloqueados"
        descricao="Dependem de outro job que ainda não foi concluído."
        linhas={p.bloqueados}
        total={r.bloqueados}
        tom="warning"
      />
      <BlocoJobs
        titulo="Parados"
        descricao={
          `${p.semAtualizacaoResumo.total} de ${r.jobsAbertos} jobs abertos estão sem nenhuma alteração — ` +
          `${p.semAtualizacaoResumo.maisDe7Dias} há mais de 7 dias e ${p.semAtualizacaoResumo.maisDe14Dias} há mais de 14. ` +
          "Nessa proporção, isso é um padrão (o sistema não está acompanhando o trabalho), não uma lista de pendências."
        }
        linhas={p.semAtualizacao.slice(0, 10)}
        total={r.semAtualizacao}
        tom="warning"
      />
      <BlocoJobs
        titulo="Briefing vazio ou raso"
        descricao="Medido por tamanho do texto. Se o briefing é suficiente ou não, quem julga é a IA depois."
        linhas={p.briefingFraco}
        total={r.briefingFraco}
        tom="warning"
      />
      <BlocoJobs
        titulo="Remarcados"
        descricao="Data de postagem remarcada várias vezes — costuma indicar um gargalo, não um atraso."
        linhas={p.remarcados}
        total={r.remarcados}
        tom="warning"
      />

      {p.escopoEstourado.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Escopo estourado no mês</CardTitle>
              <Badge variant="destructive">{p.escopoEstourado.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Contratado × utilizado, pela mesma régua da Estação do Cliente. Isto é conta, não opinião.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Cliente</th>
                    <th className="py-2 pr-3 font-medium">Item</th>
                    <th className="py-2 pr-3 font-medium">Contratado</th>
                    <th className="py-2 pr-3 font-medium">Utilizado</th>
                    <th className="py-2 font-medium">Excedente</th>
                  </tr>
                </thead>
                <tbody>
                  {p.escopoEstourado.map((e, i) => (
                    <tr key={`${e.cliente}-${e.item}-${i}`} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3">{e.cliente}</td>
                      <td className="py-2 pr-3">{e.item}</td>
                      <td className="py-2 pr-3">{e.contratado}</td>
                      <td className="py-2 pr-3">{e.utilizado}</td>
                      <td className="py-2 font-medium text-destructive">
                        +{e.excedente} {e.unidade}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {(p.contratosVencendo.length > 0 || p.reajustesAtrasados.length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Contratos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 text-sm">
            {p.reajustesAtrasados.length > 0 && (
              <div>
                <p className="mb-2 font-medium text-destructive">
                  Reajuste passou da data ({p.reajustesAtrasados.length})
                </p>
                <ul className="space-y-1">
                  {p.reajustesAtrasados.map((c, i) => (
                    <li key={`${c.cliente}-${i}`} className="text-muted-foreground">
                      <span className="text-foreground">{c.cliente}</span> — previsto para{" "}
                      {dataCurta(c.reajusteEm)}, há {c.diasDesde} dia(s)
                      {c.observacao ? ` · ${c.observacao}` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.contratosVencendo.length > 0 && (
              <div>
                <p className="mb-2 font-medium">
                  Vencendo em até {p.janelas.contratoVencendoDias} dias ({p.contratosVencendo.length})
                </p>
                <ul className="space-y-1">
                  {p.contratosVencendo.map((c, i) => (
                    <li key={`${c.cliente}-${i}`} className="text-muted-foreground">
                      <span className="text-foreground">{c.cliente}</span>
                      {c.servico ? ` (${c.servico})` : ""} — termina em {dataCurta(c.dataFim)}, faltam{" "}
                      {c.diasRestantes} dia(s)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {p.clientesParados.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Clientes parados</CardTitle>
              <Badge variant="warning">{p.clientesParados.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Clientes de carteira (com job ou contrato ativo) sem nada mexido há {p.janelas.clienteParadoDias} dias.
              Outros {p.cadastrosSemMovimento} cadastros marcados como ativos nunca tiveram job nem contrato — são base
              antiga, ficaram fora daqui de propósito.
            </p>
          </CardHeader>
          <CardContent className="pt-0 text-sm">
            <ul className="space-y-1">
              {p.clientesParados.map((c, i) => (
                <li key={`${c.cliente}-${i}`} className="text-muted-foreground">
                  <span className="text-foreground">{c.cliente}</span> —{" "}
                  {c.diasSemMexer == null ? "nenhum job registrado" : `há ${c.diasSemMexer} dia(s)`}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Carga por pessoa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Contagem de jobs — não horas. O TREM não registra estimativa de esforço nem capacidade semanal.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Pessoa</th>
                  <th className="py-2 pr-3 font-medium">Abertos</th>
                  <th className="py-2 pr-3 font-medium">Atrasados</th>
                  <th className="py-2 pr-3 font-medium">Vencendo</th>
                  <th className="py-2 font-medium">Briefing fraco</th>
                </tr>
              </thead>
              <tbody>
                {p.cargaPorPessoa.map((c) => (
                  <tr key={c.pessoa} className="border-b border-border/50 last:border-0">
                    <td className="py-2 pr-3">{c.pessoa}</td>
                    <td className="py-2 pr-3">{c.abertos}</td>
                    <td className={c.atrasados > 0 ? "py-2 pr-3 font-medium text-destructive" : "py-2 pr-3"}>
                      {c.atrasados}
                    </td>
                    <td className="py-2 pr-3">{c.vencendo}</td>
                    <td className="py-2">{c.semBriefing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-warning">
        <CardHeader className="pb-3">
          <CardTitle>O que o sistema não sabe</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lacunas de dado. Estão aqui justamente para que a IA não invente depois — e para orientar o que vale
            passar a registrar.
          </p>
        </CardHeader>
        <CardContent className="space-y-3 pt-0 text-sm">
          {p.lacunas.map((l) => (
            <div key={l.titulo}>
              <p className="font-medium">
                {l.titulo}
                {l.quantidade != null && <span className="text-muted-foreground"> — {l.quantidade}</span>}
              </p>
              <p className="text-muted-foreground">{l.detalhe}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Pacote em JSON</CardTitle>
            <CopiarPacote json={json} />
          </div>
          <p className="text-sm text-muted-foreground">
            É exatamente isto que seria entregue ao Claude na próxima fase.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <details>
            <summary className="cursor-pointer text-sm text-muted-foreground">Ver JSON completo</summary>
            <pre className="mt-3 max-h-[32rem] overflow-auto rounded-md bg-muted p-4 text-xs">{json}</pre>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
