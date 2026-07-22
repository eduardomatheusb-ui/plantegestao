"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, BookMarked, Sparkles, CircleCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { marcarLembreteVisto } from "@/lib/lembretes/actions";
import type { Lembrete } from "@/lib/lembretes/pendencias";

/**
 * Popup diário de uso do sistema. Aparece uma vez por dia, e só quando há algo
 * a dizer — dia limpo não incomoda ninguém. Fecha sem travar nada: o objetivo é
 * criar hábito, não punir.
 */
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

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {lembrete.pendencias.length > 0
              ? `${primeiroNome}, ${lembrete.pendencias.length === 1 ? "uma coisa sua" : `${lembrete.pendencias.length} coisas suas`} hoje`
              : `Oi, ${primeiroNome}`}
          </DialogTitle>
          <DialogDescription>
            {lembrete.pendencias.length > 0
              ? "São registros que só você pode completar — e que o resto da agência usa."
              : "Nada pendente do seu lado. Só um recado rápido."}
          </DialogDescription>
        </DialogHeader>

        {lembrete.pendencias.length > 0 && (
          <ul className="space-y-2">
            {lembrete.pendencias.map((p) => (
              <li key={p.chave} className="rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{p.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{p.detalhe}</p>
                <Link
                  href={p.href}
                  onClick={fechar}
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {p.acao} <ArrowRight className="size-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {restantes > 0 && (
          <p className="text-xs text-muted-foreground">
            Tem mais {restantes} {restantes === 1 ? "pendência" : "pendências"} suas — mostro amanhã, uma coisa de
            cada vez.
          </p>
        )}

        {lembrete.placar && (
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <CircleCheck
              className={lembrete.placar.bom ? "mt-0.5 size-4 text-success" : "mt-0.5 size-4 text-muted-foreground"}
            />
            <div className="text-sm">
              <p className="font-medium">{lembrete.placar.valor}</p>
              <p className="text-muted-foreground">{lembrete.placar.rotulo}</p>
            </div>
          </div>
        )}

        {lembrete.manualNuncaLido && (
          <div className="flex items-start gap-2 rounded-lg border border-border p-3">
            <BookMarked className="mt-0.5 size-4 shrink-0" />
            <div className="text-sm">
              <p className="font-medium">Você ainda não abriu a Bíblia Operacional</p>
              <p className="text-muted-foreground">
                É onde estão as regras de como a Plante trabalha — o que fazer antes de produzir, como entregar,
                o que nunca pode faltar.
              </p>
              <Link
                href="/manual"
                onClick={fechar}
                className="mt-2 inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
              >
                Abrir a Bíblia <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        )}

        {lembrete.novidades.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-4" /> Novidades no TREM
            </p>
            {lembrete.novidades.map((n) => (
              <div key={n.data} className="mt-2 text-sm">
                <p className="font-medium">{n.titulo}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {n.itens.map((i, idx) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={fechar}>
            Entendi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
