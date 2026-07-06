import "server-only";

const TIMEOUT_MS = 45_000;
const OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = process.env.AGENTE_OPENAI_MODEL || "gpt-4.1-mini";

export type DadosGrafica = {
  produto: string;
  quantidade: string;
  tamanho: string;
  impressao: string;
  papelMaterial: string;
  acabamento: string;
  entrega: string;
  prazoMaximo: string;
  tipoGrafica: string;
};

export type AgenteGraficaResultado = {
  texto?: string;
  json?: unknown;
  error?: string;
  status?: number;
  queued?: boolean;
  requestId?: string;
  raw?: unknown;
};

export function agenteGraficaConfigurado(): boolean {
  return !!process.env.AGENTE_API_URL && !!process.env.AGENTE_API_KEY;
}

export function montarPromptGrafica(d: DadosGrafica): string {
  return `
Pesquise preços de gráficas para o seguinte produto:

Produto: ${d.produto}
Quantidade: ${d.quantidade}
Tamanho: ${d.tamanho}
Impressão: ${d.impressao}
Papel/material: ${d.papelMaterial}
Acabamento: ${d.acabamento}
Entrega: ${d.entrega}
Prazo máximo: ${d.prazoMaximo}
Tipo de gráfica: ${d.tipoGrafica}

Compare pelo menos 5 opções quando possível. Monte uma tabela com gráfica, preço do produto, frete, preço total, preço unitário, prazo, especificações e link/fonte. Depois me diga qual tem melhor preço, melhor prazo e melhor custo-benefício. Não finalize pedido nem insira dados pessoais.
`.trim();
}

function normalizarToken(token: string): string {
  return token.trim().replace(/^["']|["']$/g, "").replace(/^Bearer\s+/i, "");
}

function isOpenAiPlatformKey(token: string): boolean {
  return token.startsWith("sk-");
}

function respostaParaTexto(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const texto = obj.texto ?? obj.text ?? obj.output_text ?? obj.output ?? obj.response ?? obj.result;
    if (typeof texto === "string") return texto;
  }
  return JSON.stringify(data, null, 2);
}

function criarId(prefixo: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefixo}-${Date.now().toString(36)}-${rand}`;
}

function extrairTextoOpenAi(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  if (typeof obj.output_text === "string" && obj.output_text.trim()) return obj.output_text.trim();

  const output = obj.output;
  if (!Array.isArray(output)) return null;

  const partes: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const bloco of content) {
      if (!bloco || typeof bloco !== "object") continue;
      const b = bloco as Record<string, unknown>;
      const text = b.text ?? b.output_text;
      if (typeof text === "string" && text.trim()) partes.push(text.trim());
    }
  }
  return partes.length ? partes.join("\n\n") : null;
}

async function chamarOpenAiResponses(dados: DadosGrafica, apiKey: string, requestId: string): Promise<AgenteGraficaResultado> {
  const prompt = montarPromptGrafica(dados);
  try {
    const res = await fetch(OPENAI_RESPONSES_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        tools: [{ type: "web_search" }],
        input: prompt,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { texto: raw };
    }

    if (!res.ok) {
      const mensagem =
        data && typeof data === "object" && "error" in data
          ? JSON.stringify((data as Record<string, unknown>).error)
          : respostaParaTexto(data);
      return {
        error: `A OpenAI não respondeu corretamente. ${mensagem}`,
        status: res.status,
        requestId,
        raw: data,
      };
    }

    return {
      texto: extrairTextoOpenAi(data) ?? respostaParaTexto(data),
      status: res.status,
      requestId,
      json: data,
    };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha de rede com a OpenAI.";
    return { error: mensagem, requestId };
  }
}

async function chamarWorkspaceAgent(dados: DadosGrafica, apiKey: string, requestId: string): Promise<AgenteGraficaResultado> {
  if (!process.env.AGENTE_API_URL) {
    return {
      error: "Agente de gráfica não configurado. Defina AGENTE_API_URL no ambiente.",
      requestId,
    };
  }

  const prompt = montarPromptGrafica(dados);

  try {
    const res = await fetch(process.env.AGENTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": requestId,
      },
      body: JSON.stringify({
        conversation_key: `plante-${dados.produto || "grafica"}`
          .toLowerCase()
          .replace(/[^a-z0-9-]+/g, "-")
          .slice(0, 80),
        input: prompt,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const raw = await res.text();
    let data: unknown;
    try {
      data = raw ? JSON.parse(raw) : null;
    } catch {
      data = { texto: raw };
    }

    if (!res.ok) {
      const erro =
        res.status === 401
          ? "O agente recusou a autenticação. Gere um ChatGPT Workspace Agent access token com o escopo Workspace Agents e salve em AGENTE_API_KEY."
          : "O agente não respondeu corretamente.";
      return { error: erro, status: res.status, requestId, raw: data };
    }

    if (res.status === 202) {
      return {
        queued: true,
        status: res.status,
        requestId,
        texto:
          "Solicitação enviada ao Workspace Agent. A API confirmou o recebimento, mas esse tipo de agente roda de forma assíncrona e não devolve a comparação pronta nesta tela. Verifique o destino configurado no agente ou use uma integração síncrona para exibir a resposta aqui.",
        json: data,
      };
    }

    return {
      texto: respostaParaTexto(data),
      status: res.status,
      requestId,
      json: data,
    };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha de rede com o agente.";
    return { error: mensagem, requestId };
  }
}

export async function chamarAgenteGrafica(dados: DadosGrafica): Promise<AgenteGraficaResultado> {
  if (!process.env.AGENTE_API_KEY) {
    return {
      error: "Agente de gráfica não configurado. Defina AGENTE_API_KEY no ambiente.",
    };
  }

  const apiKey = normalizarToken(process.env.AGENTE_API_KEY!);
  const requestId = criarId("grafica");

  return isOpenAiPlatformKey(apiKey)
    ? chamarOpenAiResponses(dados, apiKey, requestId)
    : chamarWorkspaceAgent(dados, apiKey, requestId);
}
