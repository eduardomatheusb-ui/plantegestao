"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookMarked,
  Sparkles,
  PartyPopper,
  Trophy,
  Send,
  FileText,
  CalendarClock,
  UserSquare2,
  Hourglass,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { marcarLembreteVisto } from "@/lib/lembretes/actions";
import type { Lembrete } from "@/lib/lembretes/pendencias";

/**
 * Popup diário de uso do sistema. Uma vez por dia e só quando há algo a dizer.
 *
 * O tom importa tanto quanto o conteúdo: quem abre isso de manhã precisa sair
 * com vontade de resolver, não com sensação de cobrança. Por isso o avanço vem
 * antes da pendência, e a pendência vem com o porquê, nunca só com o número.
 */

const ICONE: Record<string, LucideIcon> = {
  "marcar-publicado": Send,
  briefing: FileText,
  "sem-prazo": CalendarClock,
  dossie: UserSquare2,
  parados: Hourglass,
};

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function LembreteUso({ lembrete }: { lembrete: Lembrete }) {
  const [aberto, setAberto] = useState(true);
  const [, iniciar] = useTransition();

  if (!lembrete.mostrar) return null;

  function fechar() {
    setAberto(false);
    iniciar(() => {
      void marcarLembreteVisto();
    });
  }

  const primeiroNome = lembrete.nome.split(" ")[0];
  const restantes = lembrete.totalPendencias - lembrete.pendencias.length;
  const temPendencia = lembrete.pendencias.length > 0;
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-h-[88vh] max-w-xl gap-0 overflow-hidden p-0">
        {/* Faixa da marca: dá identidade sem competir com o conteúdo. */}
        <div className="h-1.5 w-full bg-accent" aria-hidden="true" />

        <div className="max-h-[calc(88vh-0.375rem)] overflow-y-auto p-6">
          <DialogHeader className="mb-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{hoje}</p>
            <DialogTitle className="text-xl">
              {saudacao()}, {primeiroNome}
            </DialogTitle>
            <DialogDescription>
              {temPendencia
                ? "Alguns registros só você pode completar, e o resto da agência depende deles."
                : "Passando rapidinho para te contar uma coisa."}
            </DialogDescription>
          </DialogHeader>

          {/* Avanço vem primeiro: o dia começa com o que deu certo. */}
          {lembrete.conquista && (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-success bg-muted p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success">
                {lembrete.conquista.tom === "zerou" ? (
                  <Trophy className="size-4 text-success-foreground" />
                ) : (
                  <PartyPopper className="size-4 text-success-foreground" />
                )}
              </div>
              <div>
                <p className="font-display font-semibold text-success">{lembrete.conquista.titulo}</p>
                <p className="text-sm text-muted-foreground">{lembrete.conquista.detalhe}</p>
              </div>
            </div>
          )}

          {temPendencia && (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {lembrete.pendencias.length === 1 ? "Uma coisa sua" : `${lembrete.pendencias.length} coisas suas`}
              </p>
              <ul className="space-y-2.5">
                {lembrete.pendencias.map((p) => {
                  const Icone = ICONE[p.chave] ?? FileText;
                  return (
                    <li
                      key={p.chave}
                      className="group rounded-lg border border-border p-4 transition-colors hover:border-foreground/25 hover:bg-muted"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent">
                          <Icone className="size-4 text-accent-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{p.titulo}</p>
                          <p className="mt-1 text-sm leading-snug text-muted-foreground">{p.detalhe}</p>
                          <Link
                            href={p.href}
                            onClick={fechar}
                            className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                          >
                            {p.acao}
                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {restantes > 0 && (
                <p className="mt-2.5 text-xs text-muted-foreground">
                  Tem mais {restantes} {restantes === 1 ? "pendência" : "pendências"} suas. Vou mostrando aos
                  poucos, para não virar lista infinita.
                </p>
              )}
            </>
          )}

          {/* Placar pessoal: você contra você, nunca contra colega. */}
          {lembrete.placar && (
            <div className="mt-5 rounded-lg bg-muted p-4">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm text-muted-foreground">{lembrete.placar.rotulo}</p>
                <p className="font-display text-lg font-semibold">
                  {lembrete.placar.feitas}
                  <span className="text-muted-foreground">/{lembrete.placar.total}</span>
                </p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={lembrete.placar.pct >= 80 ? "h-full rounded-full bg-success" : "h-full rounded-full bg-accent"}
                  style={{ width: `${Math.max(lembrete.placar.pct, 3)}%` }}
                />
              </div>
            </div>
          )}

          {lembrete.manualNuncaLido && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-border p-4">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
                <BookMarked className="size-4" />
              </div>
              <div>
                <p className="font-medium">Você ainda não abriu a Bíblia Operacional</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">
                  É onde estão as regras de como a Plante trabalha: o que fazer antes de produzir, como entregar, o
                  que nunca pode faltar.
                </p>
                <Link
                  href="/manual"
                  onClick={fechar}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold underline-offset-4 hover:underline"
                >
                  Abrir a Bíblia <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          )}

          {lembrete.novidades.length > 0 && (
            <div className="mt-5 rounded-lg border border-accent p-4">
              <p className="flex items-center gap-2 font-display font-semibold">
                <Sparkles className="size-4" /> Novidades no TREM
              </p>
              {lembrete.novidades.map((n) => (
                <div key={n.data} className="mt-3 text-sm">
                  <p className="font-medium">{n.titulo}</p>
                  <ul className="mt-1.5 space-y-1 text-muted-foreground">
                    {n.itens.map((i, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                        <span className="leading-snug">{i}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Button type="button" onClick={fechar}>
              {temPendencia ? "Combinado" : "Entendi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
