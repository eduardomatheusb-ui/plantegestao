"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Send, Copy, Check, X, ExternalLink } from "lucide-react";
import { enviarParaAprovacao, cancelarAprovacao } from "@/lib/aprovacao/actions";
import { rotuloAprovacao, corAprovacao } from "@/lib/aprovacao/status";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Evento = { id: string; acao: string; autor: string | null; comentario: string | null; criadoEm: Date };

function dataBR(d: Date) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(d));
}

const rotuloAcao: Record<string, string> = {
  enviado: "enviado para aprovação", reenviado: "reenviado", aprovado: "✅ aprovado pelo cliente", ajustes: "✏️ ajustes solicitados",
};

function BotaoEnviar({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="sm" disabled={pending}>{pending ? "Enviando…" : children}</Button>;
}

export function AprovacaoPanel({
  jobId, status, token, link, emailCliente, eventos,
}: {
  jobId: string;
  status: string;
  token: string | null;
  link: string | null;
  emailCliente: string | null;
  eventos: Evento[];
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch { /* ignora */ }
  }

  const ativo = status !== "rascunho";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `${corAprovacao(status)}22`, color: corAprovacao(status) }}>
          {rotuloAprovacao(status)}
        </span>
      </div>

      {!ativo && (
        <form action={enviarParaAprovacao.bind(null, jobId)} className="space-y-2">
          <p className="text-sm text-muted-foreground">Gere um link para o cliente aprovar a peça (sem login). Opcional: avisar por e-mail.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input name="emailCliente" type="email" placeholder={emailCliente || "e-mail do cliente (opcional)"} defaultValue={emailCliente ?? ""} className="sm:flex-1" />
            <BotaoEnviar><Send className="size-4" /> Enviar para aprovação</BotaoEnviar>
          </div>
        </form>
      )}

      {ativo && link && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Link do cliente</p>
          <div className="flex items-center gap-2">
            <Input readOnly value={link} className="flex-1 text-xs" onFocus={(e) => e.currentTarget.select()} />
            <Button type="button" variant="outline" size="sm" onClick={copiar}>
              {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
            </Button>
            <Button asChild variant="outline" size="sm"><a href={link} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /> Abrir</a></Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <form action={enviarParaAprovacao.bind(null, jobId)}>
              <BotaoEnviar><Send className="size-4" /> Reenviar / atualizar</BotaoEnviar>
            </form>
            <form action={cancelarAprovacao.bind(null, jobId)}>
              <Button type="submit" variant="ghost" size="sm"><X className="size-4" /> Cancelar aprovação</Button>
            </form>
          </div>
        </div>
      )}

      {eventos.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Histórico</p>
          <ul className="space-y-2 text-sm">
            {eventos.map((e) => (
              <li key={e.id}>
                <span className="text-muted-foreground">{dataBR(e.criadoEm)}</span> — {rotuloAcao[e.acao] ?? e.acao}
                {e.autor && <span className="text-muted-foreground"> · {e.autor}</span>}
                {e.comentario && <p className="mt-0.5 rounded-md bg-muted/50 p-2 text-xs">&ldquo;{e.comentario}&rdquo;</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
