"use client";

import * as React from "react";
import { FileText, FileCode, RefreshCw, Ban, Loader2, AlertTriangle, ReceiptText } from "lucide-react";
import { emitirNfseDaOs, emitirNfseDoLancamento, sincronizarNfse, cancelarNfseDaOs } from "@/lib/nf/actions";
import { Button } from "@/components/ui/button";
import { formatBRL, cn } from "@/lib/utils";
import type { NotaFiscalView } from "@/lib/nf/queries";
import type { NfStatus } from "@prisma/client";

const ROTULO: Record<NfStatus, string> = {
  PROCESSANDO: "Processando",
  AUTORIZADA: "Autorizada",
  ERRO: "Erro",
  CANCELADA: "Cancelada",
};
const COR: Record<NfStatus, string> = {
  PROCESSANDO: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  AUTORIZADA: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  ERRO: "bg-destructive/10 text-destructive",
  CANCELADA: "bg-muted text-muted-foreground",
};

export function NfPainel({
  origemTipo,
  origemId,
  notas,
  podeEditar,
  estado,
  homologacao,
}: {
  origemTipo: "os" | "lancamento";
  origemId: string;
  notas: NotaFiscalView[];
  podeEditar: boolean;
  estado: { configurado: boolean; provedor: boolean; faltando: string[] };
  homologacao: boolean;
}) {
  const [pending, start] = React.useTransition();
  const [erro, setErro] = React.useState<string | null>(null);

  function emitir() {
    setErro(null);
    start(async () => {
      const r = origemTipo === "os" ? await emitirNfseDaOs(origemId) : await emitirNfseDoLancamento(origemId);
      if (!r.ok) setErro(r.erro ?? "Não foi possível emitir.");
    });
  }
  function sincronizar(id: string) {
    start(async () => { await sincronizarNfse(id); });
  }
  function cancelar(id: string) {
    const just = window.prompt("Motivo do cancelamento (mínimo 15 caracteres):") ?? "";
    if (!just) return;
    setErro(null);
    start(async () => {
      const r = await cancelarNfseDaOs(id, just);
      if (!r.ok) setErro(r.erro ?? "Não foi possível cancelar.");
    });
  }

  const bloqueado = !estado.configurado || !estado.provedor;

  return (
    <div className="space-y-3">
      {homologacao && (
        <p className="flex items-start gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Ambiente de <strong>homologação</strong> (teste) — as notas emitidas aqui não têm valor fiscal. Mude para produção só com o certificado e os dados conferidos.
        </p>
      )}

      {!estado.provedor && (
        <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
          Provedor de NFS-e ainda não conectado. Defina <code>FOCUS_NFE_TOKEN</code> nas variáveis de ambiente para habilitar a emissão.
        </p>
      )}
      {!estado.configurado && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Faltam dados fiscais da empresa: {estado.faltando.join(", ")}. Preencha em Administração → Dados da empresa.
        </p>
      )}
      {erro && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{erro}</p>}

      {notas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma NFS-e emitida para esta OS.</p>
      ) : (
        <ul className="space-y-2">
          {notas.map((n) => (
            <li key={n.id} className="rounded-md border border-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", COR[n.status])}>{ROTULO[n.status]}</span>
                {n.numero && <span className="text-sm font-medium">NFS-e nº {n.numero}</span>}
                <span className="text-sm text-muted-foreground">· {formatBRL(n.valor)}</span>
                <div className="ml-auto flex items-center gap-1">
                  {n.urlPdf && <Button asChild variant="outline" size="sm"><a href={n.urlPdf} target="_blank" rel="noopener noreferrer"><FileText className="size-4" /> PDF</a></Button>}
                  {n.urlXml && <Button asChild variant="outline" size="sm"><a href={n.urlXml} target="_blank" rel="noopener noreferrer"><FileCode className="size-4" /> XML</a></Button>}
                  {n.status === "PROCESSANDO" && (
                    <Button variant="outline" size="sm" disabled={pending} onClick={() => sincronizar(n.id)}>
                      {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />} Atualizar
                    </Button>
                  )}
                  {podeEditar && n.status === "AUTORIZADA" && (
                    <Button variant="ghost" size="sm" disabled={pending} onClick={() => cancelar(n.id)}>
                      <Ban className="size-4" /> Cancelar
                    </Button>
                  )}
                </div>
              </div>
              {n.mensagemErro && <p className="mt-1.5 text-xs text-destructive">{n.mensagemErro}</p>}
            </li>
          ))}
        </ul>
      )}

      {podeEditar && (
        <Button onClick={emitir} disabled={pending || bloqueado} title={bloqueado ? "Conclua a configuração fiscal e conecte o provedor" : undefined}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <ReceiptText className="size-4" />}
          Emitir NFS-e
        </Button>
      )}
    </div>
  );
}
