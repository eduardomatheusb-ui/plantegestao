import Link from "next/link";
import { Plus, ChevronLeft, ChevronRight, Video } from "lucide-react";
import { requireUser, podePapel } from "@/lib/rbac";
import { baseUrl } from "@/lib/email";
import { listarCompromissosMes, proximosCompromissos } from "@/lib/agenda/queries";
import { garantirTokenAgenda } from "@/lib/agenda/actions";
import { MESES, TIPOS_COMPROMISSO, corTipo, rotuloTipo, rotuloRecorrencia } from "@/lib/agenda/constants";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { CalendarioMes } from "@/components/agenda/calendario-mes";
import { AssinaturaAgenda } from "@/components/agenda/assinatura-agenda";

export const dynamic = "force-dynamic";

function intp(v: string | undefined, fallback: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function fmtQuando(c: { inicio: Date; diaInteiro: boolean }) {
  const opts: Intl.DateTimeFormatOptions = c.diaInteiro
    ? { day: "2-digit", month: "2-digit" }
    : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" };
  return new Intl.DateTimeFormat("pt-BR", opts).format(new Date(c.inicio));
}

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ ano?: string; mes?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const agora = new Date();
  let ano = intp(sp.ano, agora.getFullYear());
  let mes = intp(sp.mes, agora.getMonth() + 1);
  if (mes < 1) { mes = 12; ano -= 1; }
  if (mes > 12) { mes = 1; ano += 1; }

  const [compromissos, proximos, token] = await Promise.all([
    listarCompromissosMes(ano, mes),
    proximosCompromissos(6),
    garantirTokenAgenda(),
  ]);

  const prevAno = mes === 1 ? ano - 1 : ano;
  const prevMes = mes === 1 ? 12 : mes - 1;
  const nextAno = mes === 12 ? ano + 1 : ano;
  const nextMes = mes === 12 ? 1 : mes + 1;

  const url = `${baseUrl()}/api/agenda/ics?token=${token}`;

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Agenda da agência"
        descricao="Compromissos de todo o time num só lugar. Assine no Google/Apple Agenda para acompanhar do celular."
        acao={<Button asChild><Link href="/agenda/novo"><Plus className="size-4" /> Novo compromisso</Link></Button>}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" aria-label="Mês anterior">
            <Link href={`/agenda?ano=${prevAno}&mes=${prevMes}`}><ChevronLeft className="size-4" /></Link>
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Próximo mês">
            <Link href={`/agenda?ano=${nextAno}&mes=${nextMes}`}><ChevronRight className="size-4" /></Link>
          </Button>
          <h2 className="ml-2 font-display text-lg font-semibold capitalize">{MESES[mes - 1]} de {ano}</h2>
        </div>
        <Button asChild variant="ghost" size="sm"><Link href="/agenda">Hoje</Link></Button>
      </div>

      <CalendarioMes ano={ano} mes={mes} compromissos={compromissos} />

      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {TIPOS_COMPROMISSO.map((t) => (
          <span key={t.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: t.cor }} aria-hidden="true" />
            {t.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Próximos compromissos</h3>
          {proximos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum compromisso à frente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {proximos.map((c) => {
                const urlReuniao = c.local?.match(/https?:\/\/[^\s]+/)?.[0] ?? null;
                return (
                <li key={c.ocorrenciaKey} className="flex items-center gap-2">
                  <Link href={`/agenda/${c.id}/editar`} className="flex min-w-0 flex-1 items-center gap-3 py-2.5 hover:opacity-80">
                    <span className="mt-0.5 size-2.5 shrink-0 rounded-full" style={{ backgroundColor: corTipo(c.tipo) }} aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.titulo}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmtQuando(c)} · {rotuloTipo(c.tipo)}
                        {c.cliente ? ` · ${c.cliente.nomeFantasia || c.cliente.nome}` : ""}
                        {c.local ? (urlReuniao ? " · Reunião online" : ` · ${c.local}`) : ""}
                        {c.recorrenciaDias ? ` · ${rotuloRecorrencia(c.recorrenciaDias)}` : ""}
                      </p>
                    </div>
                  </Link>
                  {urlReuniao && (
                    <a href={urlReuniao} target="_blank" rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                      aria-label={`Entrar na reunião ${c.titulo}`}>
                      <Video className="size-4" aria-hidden="true" /> Entrar
                    </a>
                  )}
                </li>
                );
              })}
            </ul>
          )}
        </div>

        <AssinaturaAgenda url={url} podeRegenerar={podePapel(user.papel, "GESTOR")} />
      </div>
    </div>
  );
}
