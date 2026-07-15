import Link from "next/link";
import {
  FileText, Factory, Megaphone, Clock, ListChecks, Star,
  MessageSquare, AlertTriangle, ArrowRight, FolderKanban, Cake,
} from "lucide-react";
import { requireUser, PAPEL_LABEL } from "@/lib/rbac";
import { metricaJobsNoPrazo } from "@/lib/jobs/queries";
import {
  minhaPauta, meusProjetos, timesheetHoje, ultimosDocumentos, comentariosRecentes, contadores, aniversariantesDoMes,
} from "@/lib/dashboard/queries";
import { getClima } from "@/lib/clima";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Donut } from "@/components/dashboard/donut";
import { Saudacao } from "@/components/dashboard/saudacao";
import { formatDate, cn } from "@/lib/utils";

function fmtHoras(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h}h ${m}min`;
  if (h) return `${h}h`;
  return `${m}min`;
}

function mensagemDoDia(emAtraso: number, vencemHoje: number, pendentes: number): string {
  if (emAtraso > 0) return `Você tem ${emAtraso} ${emAtraso === 1 ? "tarefa atrasada" : "tarefas atrasadas"} — comece por elas.`;
  if (vencemHoje > 0) return `${vencemHoje} ${vencemHoje === 1 ? "entrega vence" : "entregas vencem"} hoje. Bora?`;
  if (pendentes === 0) return "Sua pauta está limpa. Bom momento para planejar.";
  return "Tudo em dia por aqui. Mantenha o ritmo.";
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [pauta, projetos, timesheet, docs, comentarios, cont, noPrazo, clima, aniversariantes] = await Promise.all([
    minhaPauta(user.id),
    meusProjetos(user.id),
    timesheetHoje(user.id),
    ultimosDocumentos(user.id),
    comentariosRecentes(),
    contadores(user.id),
    metricaJobsNoPrazo(user.id),
    getClima(),
    aniversariantesDoMes(),
  ]);
  const mesAtual = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());

  const primeiroNome = user.name?.split(" ")[0] ?? "";
  const agora = new Date();
  const inicioHoje = new Date(); inicioHoje.setHours(0, 0, 0, 0);
  const fimHoje = new Date(); fimHoje.setHours(23, 59, 59, 999);
  const vencemHoje = pauta.filter((j) => j.prazo && j.prazo >= inicioHoje && j.prazo <= fimHoje).length;
  const mensagem = mensagemDoDia(cont.emAtraso, vencemHoje, pauta.length);

  return (
    <div className="space-y-6">
      <Saudacao
        nome={primeiroNome}
        subtitulo={`${PAPEL_LABEL[user.papel]} · Plante Comunicação`}
        clima={clima}
        mensagem={mensagem}
      />

      {/* Linha 1: módulos, prazo, timesheet */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Outros módulos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Propostas", valor: cont.propostas, href: "/propostas", icon: FileText },
                { label: "Produção", valor: cont.producao, href: "/producao", icon: Factory },
                { label: "Mídia", valor: cont.midia, href: "/midia", icon: Megaphone },
              ].map((m) => (
                <Link key={m.label} href={m.href} className="rounded-lg p-2 transition-colors hover:bg-muted">
                  <m.icon className="mx-auto size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-1 font-display text-2xl font-bold tabular-nums">{m.valor}</p>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                </Link>
              ))}
            </div>
            {cont.emAtraso > 0 ? (
              <Link href="/jobs?view=minha-pauta" className="mt-3 flex items-center gap-1.5 text-xs text-destructive hover:underline">
                <AlertTriangle className="size-3.5" aria-hidden="true" />
                Você tem {cont.emAtraso} documento(s) em atraso
              </Link>
            ) : (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="size-3.5" aria-hidden="true" /> Nenhum documento em atraso
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Jobs concluídos no prazo</CardTitle></CardHeader>
          <CardContent className="p-3 pt-0">
            {noPrazo ? (
              <Link
                href="/jobs?view=lista&conclusao=com-prazo"
                className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted"
              >
                <Donut pct={noPrazo.pct} />
                <span className="text-sm text-muted-foreground">
                  {noPrazo.noPrazo} de {noPrazo.total} jobs concluídos no prazo
                  <span className="mt-1 flex items-center gap-1 text-xs font-medium text-foreground">
                    Ver quais <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-4 p-2">
                <Donut pct={0} />
                <span className="text-sm text-muted-foreground">Sem jobs concluídos ainda.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Timesheet de hoje</CardTitle></CardHeader>
          <CardContent>
            {timesheet.itens.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" /> Nenhum apontamento hoje.
              </p>
            ) : (
              <>
                <p className="font-display text-2xl font-bold tabular-nums">{fmtHoras(timesheet.totalMin)}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {timesheet.itens.slice(0, 4).map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span className="truncate">{i.alvo}</span>
                      <span className="shrink-0 tabular-nums">{fmtHoras(i.minutos)}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 2: minha pauta + meus projetos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><ListChecks className="size-4" aria-hidden="true" /> Minha pauta</CardTitle>
            <Link href="/jobs?view=minha-pauta" className="text-xs text-muted-foreground hover:text-foreground">Ver tudo</Link>
          </CardHeader>
          <CardContent>
            {pauta.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum job pendente atribuído a você. 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {pauta.map((j) => {
                  const atrasado = j.prazo && j.prazo < agora;
                  return (
                    <li key={j.id}>
                      <Link href={`/jobs/${j.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{j.numero} · {j.titulo}</p>
                          <p className="truncate text-xs text-muted-foreground">{j.clienteNome}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {j.prazo && (
                            <span className={cn("text-xs tabular-nums", atrasado ? "font-medium text-destructive" : "text-muted-foreground")}>
                              {formatDate(j.prazo)}
                            </span>
                          )}
                          <span className="inline-block size-2.5 rounded-full" style={{ background: j.statusCor ?? "var(--border)" }} title={j.statusNome} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-sm"><FolderKanban className="size-4" aria-hidden="true" /> Meus projetos</CardTitle>
            <Link href="/projetos" className="text-xs text-muted-foreground hover:text-foreground">Ver tudo</Link>
          </CardHeader>
          <CardContent>
            {projetos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto favoritado ou sob sua responsabilidade.</p>
            ) : (
              <ul className="divide-y divide-border">
                {projetos.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projetos/${p.id}`} className="flex items-center gap-2 py-2 hover:text-foreground">
                      <Star className={cn("size-3.5 shrink-0", p.favorito ? "fill-brand-yellow text-brand-yellow" : "text-muted-foreground")} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.numero} · {p.nome}</span>
                      <span className="shrink-0 truncate text-xs text-muted-foreground">{p.clienteNome}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linha 3: últimos documentos + comentários */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Últimos documentos que edita</CardTitle></CardHeader>
          <CardContent>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Você ainda não é responsável por nenhum documento.</p>
            ) : (
              <ul className="divide-y divide-border">
                {docs.map((d, i) => (
                  <li key={i}>
                    <Link href={d.href} className="flex items-center justify-between gap-3 py-2 hover:text-foreground">
                      <span className="min-w-0">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.tipo}</span>
                        <span className="block truncate text-sm">{d.numero} · {d.titulo}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">{formatDate(d.atualizadoEm)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><MessageSquare className="size-4" aria-hidden="true" /> Comentários recentes</CardTitle></CardHeader>
          <CardContent>
            {comentarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem comentários recentes.</p>
            ) : (
              <ul className="space-y-1">
                {comentarios.map((c) => {
                  const conteudo = (
                    <>
                      <span className="block text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{c.autorNome}</span> · {c.contexto} · {formatDate(c.criadoEm)}
                      </span>
                      <span className="line-clamp-2 text-foreground/90">{c.texto}</span>
                    </>
                  );
                  return (
                    <li key={c.id} className="text-sm">
                      {c.href ? (
                        <Link href={c.href} className="-mx-2 block rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
                          {conteudo}
                        </Link>
                      ) : (
                        <div className="px-0 py-1.5">{conteudo}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aniversariantes do mês */}
      {aniversariantes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Cake className="size-4 text-brand-yellow" aria-hidden="true" /> Aniversariantes de {mesAtual}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {aniversariantes.map((a) => (
                <li key={a.id} className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm">
                  <span className="flex size-6 items-center justify-center rounded-full bg-brand-yellow text-[11px] font-bold text-ink-900 tabular-nums">{a.dia}</span>
                  {a.nome}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
