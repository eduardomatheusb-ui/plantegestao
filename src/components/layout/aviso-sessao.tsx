"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MAX_MS = 4 * 60 * 60 * 1000; // deve casar com session.maxAge (4h)
const AVISO_MS = 5 * 60 * 1000; // avisa 5 min antes
const REFRESH_MIN_MS = 14 * 60 * 1000; // desliza a sessão no máx. 1x/14min de uso

function mmss(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** Avisa antes do logout por inatividade e mantém a sessão viva durante o uso. */
export function AvisoSessao() {
  const router = useRouter();
  const ultimaAtividade = useRef(Date.now());
  const ultimoRefresh = useRef(Date.now());
  const [restante, setRestante] = useState<number | null>(null);

  const registrarAtividade = useCallback(() => {
    ultimaAtividade.current = Date.now();
    if (Date.now() - ultimoRefresh.current > REFRESH_MIN_MS) {
      ultimoRefresh.current = Date.now();
      router.refresh(); // desliza o token da sessão durante o uso ativo
    }
  }, [router]);

  useEffect(() => {
    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    let ultimo = 0;
    const handler = () => {
      const agora = Date.now();
      if (agora - ultimo < 3000) return; // throttle
      ultimo = agora;
      registrarAtividade();
    };
    eventos.forEach((e) => window.addEventListener(e, handler, { passive: true }));

    const id = setInterval(() => {
      const ocioso = Date.now() - ultimaAtividade.current;
      const rem = MAX_MS - ocioso;
      if (rem <= 0) { window.location.href = "/login"; return; }
      setRestante(rem <= AVISO_MS ? rem : null);
    }, 1000);

    return () => {
      eventos.forEach((e) => window.removeEventListener(e, handler));
      clearInterval(id);
    };
  }, [registrarAtividade]);

  function continuar() {
    ultimaAtividade.current = Date.now();
    ultimoRefresh.current = Date.now();
    setRestante(null);
    router.refresh();
  }

  return (
    <Dialog open={restante != null} onOpenChange={(o) => { if (!o) continuar(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Clock className="size-5 text-warning" aria-hidden="true" /> Sua sessão vai expirar</DialogTitle>
          <DialogDescription>
            Por segurança, você será desconectado por inatividade em{" "}
            <span className="font-semibold tabular-nums text-foreground">{mmss(restante ?? 0)}</span>. Quer continuar conectado?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={continuar} className="w-full sm:w-auto">Continuar conectado</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
