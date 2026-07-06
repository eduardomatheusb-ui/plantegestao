"use client";

import * as React from "react";
import { AlertCircle, Check, Copy, FileDown, Search } from "lucide-react";
import { gerarComparacaoGraficaAction, type AgenteGraficaResultado, type DadosGrafica } from "@/lib/agentes/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

const inicial: DadosGrafica = {
  produto: "",
  quantidade: "",
  tamanho: "",
  impressao: "",
  papelMaterial: "",
  acabamento: "",
  entrega: "",
  prazoMaximo: "",
  tipoGrafica: "online ou local",
};

export function ComparacaoGraficaForm() {
  const [dados, setDados] = React.useState<DadosGrafica>(inicial);
  const [resultado, setResultado] = React.useState<AgenteGraficaResultado | null>(null);
  const [dadosResultado, setDadosResultado] = React.useState<DadosGrafica | null>(null);
  const [copiado, setCopiado] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();

  function atualizar(campo: keyof DadosGrafica, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function consultar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResultado(null);
    iniciar(async () => {
      try {
        const res = await gerarComparacaoGraficaAction(dados);
        setResultado(res);
        if (res.texto && !res.error) setDadosResultado(dados);
      } catch (err) {
        if (!recarregarSeStale(err)) {
          const mensagem = err instanceof Error ? err.message : "Não foi possível consultar o agente agora.";
          setResultado({ error: mensagem });
        }
      }
    });
  }

  async function copiar() {
    if (!resultado?.texto) return;
    try {
      await navigator.clipboard.writeText(resultado.texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // O texto permanece disponível mesmo se a cópia for bloqueada pelo navegador.
    }
  }

  function escaparHtml(valor: string): string {
    return valor
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function exportarPdf() {
    if (!resultado?.texto || !dadosResultado) return;
    const emitidoEm = new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date());
    const linhas = [
      ["Produto", dadosResultado.produto],
      ["Quantidade", dadosResultado.quantidade],
      ["Tamanho", dadosResultado.tamanho],
      ["Impressão", dadosResultado.impressao],
      ["Papel/material", dadosResultado.papelMaterial],
      ["Acabamento", dadosResultado.acabamento],
      ["Entrega", dadosResultado.entrega],
      ["Prazo máximo", dadosResultado.prazoMaximo],
      ["Tipo de gráfica", dadosResultado.tipoGrafica],
    ];
    const especificacoes = linhas
      .map(([rotulo, valor]) => `
        <div class="spec">
          <span>${escaparHtml(rotulo)}</span>
          <strong>${escaparHtml(valor || "-")}</strong>
        </div>
      `)
      .join("");
    const resultadoHtml = escaparHtml(resultado.texto);
    const janela = window.open("", "_blank", "noopener,noreferrer");
    if (!janela) return;

    janela.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Comparação de gráficas - Plante</title>
  <style>
    @page { margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111;
      background: #f4f5f3;
      font-family: Arial, Helvetica, sans-serif;
      line-height: 1.45;
    }
    .page {
      max-width: 920px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
      padding: 34px;
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      border-bottom: 4px solid #f7ff19;
      padding-bottom: 22px;
      margin-bottom: 24px;
    }
    .brand img {
      width: 170px;
      height: auto;
      display: block;
    }
    .meta {
      text-align: right;
      color: #555;
      font-size: 12px;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 28px;
      letter-spacing: 0;
    }
    .subtitle {
      margin: 0;
      color: #555;
      font-size: 14px;
    }
    .section-title {
      margin: 26px 0 12px;
      font-size: 15px;
      text-transform: uppercase;
      letter-spacing: .08em;
      color: #222;
    }
    .spec-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 22px;
    }
    .spec {
      border: 1px solid #dedede;
      border-radius: 8px;
      padding: 10px 12px;
      min-height: 58px;
    }
    .spec span {
      display: block;
      color: #60646c;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .spec strong {
      display: block;
      font-size: 13px;
      font-weight: 700;
      word-break: break-word;
    }
    .result {
      white-space: pre-wrap;
      border: 1px solid #dedede;
      border-radius: 8px;
      padding: 18px;
      font-size: 13px;
      background: #fbfbfa;
    }
    footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #dedede;
      color: #666;
      font-size: 11px;
    }
    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <header>
      <div class="brand">
        <img src="${window.location.origin}/brand/logo-preto.svg" alt="Plante Comunicação" />
      </div>
      <div class="meta">
        <strong>Comparação de gráficas</strong><br />
        Emitido em ${escaparHtml(emitidoEm)}
      </div>
    </header>
    <h1>Comparação de produção gráfica</h1>
    <p class="subtitle">Pesquisa gerada a partir das especificações informadas no TREM.</p>
    <h2 class="section-title">Especificações</h2>
    <section class="spec-grid">${especificacoes}</section>
    <h2 class="section-title">Resultado da pesquisa</h2>
    <section class="result">${resultadoHtml}</section>
    <footer>
      Material de apoio para cotação. Revise preços, prazos, fretes e condições comerciais antes de enviar proposta ao cliente.
    </footer>
  </main>
  <script>
    window.addEventListener("load", () => {
      setTimeout(() => window.print(), 300);
    });
  </script>
</body>
</html>`);
    janela.document.close();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={consultar} className="space-y-6 rounded-md border border-border bg-card p-4 shadow-sm" noValidate>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto <span className="text-destructive">*</span></Label>
            <Input id="produto" value={dados.produto} onChange={(e) => atualizar("produto", e.target.value)} placeholder="Cartão de visita" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade <span className="text-destructive">*</span></Label>
            <Input id="quantidade" value={dados.quantidade} onChange={(e) => atualizar("quantidade", e.target.value)} placeholder="1000" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tamanho">Tamanho</Label>
            <Input id="tamanho" value={dados.tamanho} onChange={(e) => atualizar("tamanho", e.target.value)} placeholder="9x5 cm" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="impressao">Impressão</Label>
            <Input id="impressao" value={dados.impressao} onChange={(e) => atualizar("impressao", e.target.value)} placeholder="4x4" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="papelMaterial">Papel/material</Label>
            <Input id="papelMaterial" value={dados.papelMaterial} onChange={(e) => atualizar("papelMaterial", e.target.value)} placeholder="Couchê 300g" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acabamento">Acabamento</Label>
            <Input id="acabamento" value={dados.acabamento} onChange={(e) => atualizar("acabamento", e.target.value)} placeholder="Laminação fosca" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entrega">Entrega</Label>
            <Input id="entrega" value={dados.entrega} onChange={(e) => atualizar("entrega", e.target.value)} placeholder="Betim/MG" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prazoMaximo">Prazo máximo</Label>
            <Input id="prazoMaximo" value={dados.prazoMaximo} onChange={(e) => atualizar("prazoMaximo", e.target.value)} placeholder="5 dias úteis" />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="tipoGrafica">Tipo de gráfica</Label>
            <select id="tipoGrafica" className={sel} value={dados.tipoGrafica} onChange={(e) => atualizar("tipoGrafica", e.target.value)}>
              <option value="online ou local">Online ou local</option>
              <option value="online">Online</option>
              <option value="local">Local</option>
              <option value="rápida">Rápida</option>
              <option value="offset">Offset</option>
              <option value="digital">Digital</option>
            </select>
          </div>
        </div>

        <Button type="submit" disabled={pendente || !dados.produto.trim() || !dados.quantidade.trim()}>
          <Search className="size-4" />
          {pendente ? "Comparando..." : "Comparar gráficas"}
        </Button>
      </form>

      {resultado?.error && (
        <p role="alert" className="flex items-start gap-1.5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {resultado.error}
          {resultado.status ? ` Status: ${resultado.status}.` : ""}
        </p>
      )}

      {resultado?.texto && (
        <section className="space-y-3 rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Resultado</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={exportarPdf}>
                <FileDown className="size-4" /> Exportar PDF
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copiar}>
                {copiado ? (
                  <>
                    <Check className="size-4 text-emerald-600" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="size-4" /> Copiar
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Revise os preços e condições antes de usar em uma proposta.</p>
          <textarea
            readOnly
            value={resultado.texto}
            rows={Math.min(28, Math.max(10, resultado.texto.split("\n").length + 1))}
            className="w-full rounded-md border border-input bg-muted/40 p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </section>
      )}
    </div>
  );
}
