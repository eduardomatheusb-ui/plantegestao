"use client";

import * as React from "react";
import { AlertCircle, Check, Copy, FileDown, Plus, Save, Search, Trash2 } from "lucide-react";
import { gerarComparacaoGraficaAction, type AgenteGraficaResultado, type DadosGrafica } from "@/lib/agentes/actions";
import { recarregarSeStale } from "@/lib/stale-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "plante:levantamentos-graficas:v1";
const ORCAMENTO_STORAGE_KEY = "plante:orcamento-graficas-em-montagem:v1";
const sel = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";

type TabelaMarkdown = { headers: string[]; rows: string[][]; start: number; end: number };
type LevantamentoSalvo = { id: string; criadoEm: string; dados: DadosGrafica; texto: string };
type ItemOrcamento = LevantamentoSalvo;

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
  const [salvos, setSalvos] = React.useState<LevantamentoSalvo[]>([]);
  const [orcamento, setOrcamento] = React.useState<ItemOrcamento[]>([]);
  const [salvoAgora, setSalvoAgora] = React.useState(false);
  const [adicionadoAgora, setAdicionadoAgora] = React.useState(false);
  const [copiado, setCopiado] = React.useState(false);
  const [pendente, iniciar] = React.useTransition();

  const tabela = React.useMemo(() => (resultado?.texto ? extrairTabela(resultado.texto) : null), [resultado?.texto]);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setSalvos(JSON.parse(raw) as LevantamentoSalvo[]);
      const rawOrcamento = window.localStorage.getItem(ORCAMENTO_STORAGE_KEY);
      if (rawOrcamento) setOrcamento(JSON.parse(rawOrcamento) as ItemOrcamento[]);
    } catch {
      setSalvos([]);
    }
  }, []);

  function persistir(lista: LevantamentoSalvo[]) {
    setSalvos(lista);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lista.slice(0, 30)));
    } catch {
      // Se o armazenamento local estiver cheio ou bloqueado, a tela continua funcionando.
    }
  }

  function persistirOrcamento(lista: ItemOrcamento[]) {
    setOrcamento(lista);
    try {
      window.localStorage.setItem(ORCAMENTO_STORAGE_KEY, JSON.stringify(lista.slice(0, 40)));
    } catch {
      // Se o armazenamento local estiver bloqueado, o orçamento continua na sessão atual.
    }
  }

  function atualizar(campo: keyof DadosGrafica, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  function consultar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResultado(null);
    setSalvoAgora(false);
    setAdicionadoAgora(false);
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

  function salvarLevantamento() {
    if (!resultado?.texto || !dadosResultado) return;
    const novo: LevantamentoSalvo = {
      id: `lev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      criadoEm: new Date().toISOString(),
      dados: dadosResultado,
      texto: resultado.texto,
    };
    persistir([novo, ...salvos.filter((s) => s.texto !== novo.texto)]);
    setSalvoAgora(true);
    setTimeout(() => setSalvoAgora(false), 2000);
  }

  function adicionarAoOrcamento() {
    if (!resultado?.texto || !dadosResultado) return;
    const item: ItemOrcamento = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      criadoEm: new Date().toISOString(),
      dados: dadosResultado,
      texto: resultado.texto,
    };
    persistirOrcamento([item, ...orcamento]);
    setAdicionadoAgora(true);
    setTimeout(() => setAdicionadoAgora(false), 2000);
  }

  function novoItem() {
    setDados(inicial);
    setResultado(null);
    setDadosResultado(null);
    setCopiado(false);
    setSalvoAgora(false);
    setAdicionadoAgora(false);
  }

  function abrirItemOrcamento(item: ItemOrcamento) {
    setDados(item.dados);
    setDadosResultado(item.dados);
    setResultado({ texto: item.texto });
    setSalvoAgora(false);
    setAdicionadoAgora(false);
  }

  function removerItemOrcamento(id: string) {
    persistirOrcamento(orcamento.filter((item) => item.id !== id));
  }

  function limparOrcamento() {
    persistirOrcamento([]);
  }

  function abrirSalvo(item: LevantamentoSalvo) {
    setDados(item.dados);
    setDadosResultado(item.dados);
    setResultado({ texto: item.texto });
    setSalvoAgora(false);
  }

  function removerSalvo(id: string) {
    persistir(salvos.filter((s) => s.id !== id));
  }

  function baixarCsv() {
    if (!tabela) return;
    const csv = [tabela.headers, ...tabela.rows]
      .map((linha) => linha.map((celula) => `"${limparMarkdown(celula).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    baixarArquivo(`comparacao-graficas-${Date.now()}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
  }

  function baixarOrcamentoCsv() {
    if (!orcamento.length) return;
    const linhas: string[][] = [["Item", "Produto", "Quantidade", "Tamanho", "Impressão", "Papel/material", "Acabamento", "Entrega", "Prazo máximo", "Tipo de gráfica", "Resultado"]];
    orcamento.slice().reverse().forEach((item, index) => {
      linhas.push([
        String(index + 1),
        item.dados.produto,
        item.dados.quantidade,
        item.dados.tamanho,
        item.dados.impressao,
        item.dados.papelMaterial,
        item.dados.acabamento,
        item.dados.entrega,
        item.dados.prazoMaximo,
        item.dados.tipoGrafica,
        limparMarkdown(item.texto),
      ]);
    });
    const csv = linhas.map((linha) => linha.map((celula) => `"${celula.replace(/"/g, '""')}"`).join(";")).join("\n");
    baixarArquivo(`orcamento-graficas-${Date.now()}.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
  }

  function exportarPdf() {
    if (!resultado?.texto || !dadosResultado) return;
    const html = montarDocumentoHtml({
      dados: dadosResultado,
      texto: resultado.texto,
      tabela,
      emitidoEm: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      origem: window.location.origin,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const janela = window.open(url, "_blank");
    if (!janela) {
      baixarArquivo(`comparacao-graficas-${Date.now()}.html`, html, "text/html;charset=utf-8");
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  function exportarOrcamentoPdf() {
    if (!orcamento.length) return;
    const html = montarOrcamentoHtml({
      itens: orcamento.slice().reverse(),
      emitidoEm: new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date()),
      origem: window.location.origin,
    });
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const janela = window.open(url, "_blank");
    if (!janela) {
      baixarArquivo(`orcamento-graficas-${Date.now()}.html`, html, "text/html;charset=utf-8");
      URL.revokeObjectURL(url);
      return;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={consultar} className="space-y-6 rounded-md border border-border bg-card p-4 shadow-sm" noValidate>
        <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
          <Campo label="Produto" obrigatorio><Input id="produto" value={dados.produto} onChange={(e) => atualizar("produto", e.target.value)} placeholder="Cartão de visita" required /></Campo>
          <Campo label="Quantidade" obrigatorio><Input id="quantidade" value={dados.quantidade} onChange={(e) => atualizar("quantidade", e.target.value)} placeholder="1000" required /></Campo>
          <Campo label="Tamanho"><Input id="tamanho" value={dados.tamanho} onChange={(e) => atualizar("tamanho", e.target.value)} placeholder="9x5 cm" /></Campo>
          <Campo label="Impressão"><Input id="impressao" value={dados.impressao} onChange={(e) => atualizar("impressao", e.target.value)} placeholder="4x4" /></Campo>
          <Campo label="Papel/material"><Input id="papelMaterial" value={dados.papelMaterial} onChange={(e) => atualizar("papelMaterial", e.target.value)} placeholder="Couchê 300g" /></Campo>
          <Campo label="Acabamento"><Input id="acabamento" value={dados.acabamento} onChange={(e) => atualizar("acabamento", e.target.value)} placeholder="Laminação fosca" /></Campo>
          <Campo label="Entrega"><Input id="entrega" value={dados.entrega} onChange={(e) => atualizar("entrega", e.target.value)} placeholder="Betim/MG" /></Campo>
          <Campo label="Prazo máximo"><Input id="prazoMaximo" value={dados.prazoMaximo} onChange={(e) => atualizar("prazoMaximo", e.target.value)} placeholder="5 dias úteis" /></Campo>
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
        <section className="space-y-4 rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Resultado</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={salvarLevantamento}>
                <Save className="size-4" /> {salvoAgora ? "Salvo" : "Salvar"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={adicionarAoOrcamento}>
                <Plus className="size-4" /> {adicionadoAgora ? "Adicionado" : "Adicionar ao orçamento"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={novoItem}>
                Novo item
              </Button>
              {tabela && (
                <Button type="button" variant="outline" size="sm" onClick={baixarCsv}>
                  <FileDown className="size-4" /> CSV
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={exportarPdf}>
                <FileDown className="size-4" /> Exportar PDF
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={copiar}>
                {copiado ? <><Check className="size-4 text-emerald-600" /> Copiado</> : <><Copy className="size-4" /> Copiar</>}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Revise os preços e condições antes de usar em uma proposta.</p>
          <ResultadoFormatado texto={resultado.texto} tabela={tabela} />
        </section>
      )}

      {orcamento.length > 0 && (
        <section className="space-y-3 rounded-md border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold">Orçamento em montagem</h2>
              <p className="text-xs text-muted-foreground">{orcamento.length} item(ns) adicionados. Consulte produto por produto e exporte tudo junto no final.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={baixarOrcamentoCsv}>
                <FileDown className="size-4" /> CSV completo
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportarOrcamentoPdf}>
                <FileDown className="size-4" /> PDF completo
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={limparOrcamento}>
                <Trash2 className="size-4" /> Limpar
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/70">
                <tr>
                  <th className="border-b border-border px-3 py-2">Produto</th>
                  <th className="border-b border-border px-3 py-2">Quantidade</th>
                  <th className="border-b border-border px-3 py-2">Material</th>
                  <th className="border-b border-border px-3 py-2">Entrega</th>
                  <th className="border-b border-border px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orcamento.map((item) => (
                  <tr key={item.id} className="odd:bg-background even:bg-muted/25">
                    <td className="border-b border-border px-3 py-2 font-medium">{item.dados.produto || "-"}</td>
                    <td className="border-b border-border px-3 py-2">{item.dados.quantidade || "-"}</td>
                    <td className="border-b border-border px-3 py-2">{item.dados.papelMaterial || "-"}</td>
                    <td className="border-b border-border px-3 py-2">{item.dados.entrega || "-"}</td>
                    <td className="border-b border-border px-3 py-2">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => abrirItemOrcamento(item)}>Abrir</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => removerItemOrcamento(item.id)}>
                          <Trash2 className="size-4" /> Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {salvos.length > 0 && (
        <section className="space-y-3 rounded-md border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-lg font-semibold">Levantamentos salvos</h2>
          <div className="divide-y divide-border rounded-md border border-border">
            {salvos.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
                <button type="button" onClick={() => abrirSalvo(item)} className="text-left">
                  <span className="block text-sm font-semibold">{item.dados.produto || "Levantamento"}</span>
                  <span className="block text-xs text-muted-foreground">
                    {item.dados.quantidade || "-"} un. · {formatarData(item.criadoEm)}
                  </span>
                </button>
                <Button type="button" variant="ghost" size="sm" onClick={() => removerSalvo(item.id)}>
                  <Trash2 className="size-4" /> Remover
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Campo({ label, obrigatorio, children }: { label: string; obrigatorio?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label} {obrigatorio && <span className="text-destructive">*</span>}</Label>
      {children}
    </div>
  );
}

function ResultadoFormatado({ texto, tabela }: { texto: string; tabela: TabelaMarkdown | null }) {
  const linhas = texto.split(/\r?\n/);
  const antes = tabela ? linhas.slice(0, tabela.start).join("\n").trim() : "";
  const depois = tabela ? linhas.slice(tabela.end + 1).join("\n").trim() : texto;

  return (
    <div className="space-y-4">
      {antes && <BlocoTexto texto={antes} />}
      {tabela && <TabelaComparativa tabela={tabela} />}
      {depois && <BlocoTexto texto={depois} />}
    </div>
  );
}

function BlocoTexto({ texto }: { texto: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed">
      {texto.split(/\n{2,}/).map((p, idx) => (
        <p key={idx} className="whitespace-pre-wrap">{renderInline(p)}</p>
      ))}
    </div>
  );
}

function TabelaComparativa({ tabela }: { tabela: TabelaMarkdown }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted/70">
          <tr>{tabela.headers.map((h, i) => <th key={`${h}-${i}`} className="border-b border-border px-3 py-2 font-semibold">{limparMarkdown(h)}</th>)}</tr>
        </thead>
        <tbody>
          {tabela.rows.map((row, r) => (
            <tr key={r} className="odd:bg-background even:bg-muted/25">
              {tabela.headers.map((_, c) => (
                <td key={c} className="align-top border-b border-border px-3 py-2">{renderInline(row[c] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(texto: string): React.ReactNode[] {
  const limpo = texto.replace(/\*\*(.*?)\*\*/g, "$1");
  const regex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  const partes: React.ReactNode[] = [];
  let ultimo = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(limpo))) {
    if (match.index > ultimo) partes.push(limpo.slice(ultimo, match.index));
    partes.push(
      <a key={`${match[2]}-${match.index}`} href={match[2]} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
        {match[1]}
      </a>,
    );
    ultimo = match.index + match[0].length;
  }
  if (ultimo < limpo.length) partes.push(limpo.slice(ultimo));
  return partes;
}

function extrairTabela(texto: string): TabelaMarkdown | null {
  const linhas = texto.split(/\r?\n/);
  for (let i = 0; i < linhas.length - 1; i++) {
    if (!linhas[i].includes("|") || !/^\s*\|?\s*:?-{3,}/.test(linhas[i + 1])) continue;
    const headers = dividirLinhaTabela(linhas[i]);
    const rows: string[][] = [];
    let fim = i + 1;
    for (let j = i + 2; j < linhas.length; j++) {
      if (!linhas[j].includes("|")) break;
      const row = dividirLinhaTabela(linhas[j]);
      if (row.length < 2) break;
      rows.push(row);
      fim = j;
    }
    if (headers.length > 1 && rows.length) return { headers, rows, start: i, end: fim };
  }
  return null;
}

function dividirLinhaTabela(linha: string): string[] {
  return linha.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
}

function limparMarkdown(texto: string): string {
  return texto.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1 ($2)").trim();
}

function escaparHtml(valor: string): string {
  return valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatarData(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

function baixarArquivo(nome: string, conteudo: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function montarDocumentoHtml({
  dados,
  texto,
  tabela,
  emitidoEm,
  origem,
}: {
  dados: DadosGrafica;
  texto: string;
  tabela: TabelaMarkdown | null;
  emitidoEm: string;
  origem: string;
}) {
  const specs = [
    ["Produto", dados.produto],
    ["Quantidade", dados.quantidade],
    ["Tamanho", dados.tamanho],
    ["Impressão", dados.impressao],
    ["Papel/material", dados.papelMaterial],
    ["Acabamento", dados.acabamento],
    ["Entrega", dados.entrega],
    ["Prazo máximo", dados.prazoMaximo],
    ["Tipo de gráfica", dados.tipoGrafica],
  ].map(([rotulo, valor]) => `<div class="spec"><span>${escaparHtml(rotulo)}</span><strong>${escaparHtml(valor || "-")}</strong></div>`).join("");
  const conteudo = tabela ? montarHtmlComTabela(texto, tabela) : `<section class="result">${escaparHtml(texto)}</section>`;

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Comparação de gráficas - Plante</title><style>
@page{margin:16mm}*{box-sizing:border-box}body{margin:0;color:#111;background:#f4f5f3;font-family:Arial,Helvetica,sans-serif;line-height:1.45}.page{max-width:980px;margin:0 auto;background:#fff;min-height:100vh;padding:34px}header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:4px solid #f7ff19;padding-bottom:22px;margin-bottom:24px}.brand img{width:170px;height:auto;display:block}.meta{text-align:right;color:#555;font-size:12px}h1{margin:0 0 6px;font-size:28px;letter-spacing:0}.subtitle{margin:0;color:#555;font-size:14px}.section-title{margin:26px 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#222}.spec-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:22px}.spec{border:1px solid #dedede;border-radius:8px;padding:10px 12px;min-height:58px}.spec span{display:block;color:#60646c;font-size:11px;margin-bottom:4px}.spec strong{display:block;font-size:13px;font-weight:700;word-break:break-word}.result{white-space:pre-wrap;border:1px solid #dedede;border-radius:8px;padding:18px;font-size:13px;background:#fbfbfa}.table-wrap{border:1px solid #dedede;border-radius:8px;overflow:hidden}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f7ff19;color:#111;text-align:left}th,td{border-bottom:1px solid #dedede;padding:8px;vertical-align:top}tr:nth-child(even) td{background:#fafafa}.text-block{white-space:pre-wrap;font-size:13px;margin:12px 0}footer{margin-top:28px;padding-top:14px;border-top:1px solid #dedede;color:#666;font-size:11px}@media print{body{background:#fff}.page{padding:0;max-width:none}}
</style></head><body><main class="page"><header><div class="brand"><img src="${origem}/brand/logo-preto.svg" alt="Plante Comunicação" /></div><div class="meta"><strong>Comparação de gráficas</strong><br />Emitido em ${escaparHtml(emitidoEm)}</div></header><h1>Comparação de produção gráfica</h1><p class="subtitle">Pesquisa gerada a partir das especificações informadas no TREM.</p><h2 class="section-title">Especificações</h2><section class="spec-grid">${specs}</section><h2 class="section-title">Resultado da pesquisa</h2>${conteudo}<footer>Material de apoio para cotação. Revise preços, prazos, fretes e condições comerciais antes de enviar proposta ao cliente.</footer></main><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));</script></body></html>`;
}

function montarOrcamentoHtml({ itens, emitidoEm, origem }: { itens: ItemOrcamento[]; emitidoEm: string; origem: string }) {
  const resumo = itens.map((item, index) => `<tr><td>${index + 1}</td><td>${escaparHtml(item.dados.produto || "-")}</td><td>${escaparHtml(item.dados.quantidade || "-")}</td><td>${escaparHtml(item.dados.papelMaterial || "-")}</td><td>${escaparHtml(item.dados.entrega || "-")}</td></tr>`).join("");
  const secoes = itens.map((item, index) => {
    const tabelaItem = extrairTabela(item.texto);
    const specs = [
      ["Produto", item.dados.produto],
      ["Quantidade", item.dados.quantidade],
      ["Tamanho", item.dados.tamanho],
      ["Impressão", item.dados.impressao],
      ["Papel/material", item.dados.papelMaterial],
      ["Acabamento", item.dados.acabamento],
      ["Entrega", item.dados.entrega],
      ["Prazo máximo", item.dados.prazoMaximo],
      ["Tipo de gráfica", item.dados.tipoGrafica],
    ].map(([rotulo, valor]) => `<div class="spec"><span>${escaparHtml(rotulo)}</span><strong>${escaparHtml(valor || "-")}</strong></div>`).join("");
    const conteudo = tabelaItem ? montarHtmlComTabela(item.texto, tabelaItem) : `<section class="result">${escaparHtml(item.texto)}</section>`;
    return `<section class="item-section"><h2>Item ${index + 1} · ${escaparHtml(item.dados.produto || "Produto")}</h2><div class="spec-grid">${specs}</div>${conteudo}</section>`;
  }).join("");

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Orçamento gráfico - Plante</title><style>
@page{margin:16mm}*{box-sizing:border-box}body{margin:0;color:#111;background:#f4f5f3;font-family:Arial,Helvetica,sans-serif;line-height:1.45}.page{max-width:1080px;margin:0 auto;background:#fff;min-height:100vh;padding:34px}header{display:flex;align-items:flex-start;justify-content:space-between;gap:24px;border-bottom:4px solid #f7ff19;padding-bottom:22px;margin-bottom:24px}.brand img{width:170px;height:auto;display:block}.meta{text-align:right;color:#555;font-size:12px}h1{margin:0 0 6px;font-size:30px;letter-spacing:0}.subtitle{margin:0 0 22px;color:#555;font-size:14px}.section-title{margin:26px 0 12px;font-size:15px;text-transform:uppercase;letter-spacing:.08em;color:#222}.spec-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0 22px}.spec{border:1px solid #dedede;border-radius:8px;padding:10px 12px;min-height:58px}.spec span{display:block;color:#60646c;font-size:11px;margin-bottom:4px}.spec strong{display:block;font-size:13px;font-weight:700;word-break:break-word}.result{white-space:pre-wrap;border:1px solid #dedede;border-radius:8px;padding:18px;font-size:13px;background:#fbfbfa}.table-wrap{border:1px solid #dedede;border-radius:8px;overflow:hidden}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f7ff19;color:#111;text-align:left}th,td{border-bottom:1px solid #dedede;padding:8px;vertical-align:top}tr:nth-child(even) td{background:#fafafa}.text-block{white-space:pre-wrap;font-size:13px;margin:12px 0}.item-section{break-inside:avoid;margin-top:30px;padding-top:20px;border-top:1px solid #dedede}.item-section h2{font-size:20px;margin:0 0 12px}footer{margin-top:28px;padding-top:14px;border-top:1px solid #dedede;color:#666;font-size:11px}@media print{body{background:#fff}.page{padding:0;max-width:none}.item-section{break-inside:avoid}}
</style></head><body><main class="page"><header><div class="brand"><img src="${origem}/brand/logo-preto.svg" alt="Plante Comunicação" /></div><div class="meta"><strong>Orçamento gráfico em montagem</strong><br />Emitido em ${escaparHtml(emitidoEm)}</div></header><h1>Levantamento de produção gráfica</h1><p class="subtitle">Comparativo com ${itens.length} item(ns) pesquisados no TREM.</p><h2 class="section-title">Resumo dos itens</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>Produto</th><th>Quantidade</th><th>Material</th><th>Entrega</th></tr></thead><tbody>${resumo}</tbody></table></div>${secoes}<footer>Material de apoio para cotação. Revise preços, prazos, fretes e condições comerciais antes de enviar proposta ao cliente.</footer></main><script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));</script></body></html>`;
}

function montarHtmlComTabela(texto: string, tabela: TabelaMarkdown): string {
  const linhas = texto.split(/\r?\n/);
  const antes = linhas.slice(0, tabela.start).join("\n").trim();
  const depois = linhas.slice(tabela.end + 1).join("\n").trim();
  const thead = tabela.headers.map((h) => `<th>${escaparHtml(limparMarkdown(h))}</th>`).join("");
  const tbody = tabela.rows.map((row) => `<tr>${tabela.headers.map((_, i) => `<td>${escaparHtml(limparMarkdown(row[i] ?? ""))}</td>`).join("")}</tr>`).join("");
  return `${antes ? `<div class="text-block">${escaparHtml(limparMarkdown(antes))}</div>` : ""}<div class="table-wrap"><table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table></div>${depois ? `<div class="text-block">${escaparHtml(limparMarkdown(depois))}</div>` : ""}`;
}
