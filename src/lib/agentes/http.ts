import "server-only";

const TIMEOUT_MS = 45_000;

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

function respostaParaTexto(data: unknown): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const texto = obj.texto ?? obj.text ?? obj.output_text ?? obj.output ?? obj.response ?? obj.result;
    if (typeof texto === "string") return texto;
  }
  return JSON.stringify(data, null, 2);
}

export async function chamarAgenteGrafica(dados: DadosGrafica): Promise<AgenteGraficaResultado> {
  if (!agenteGraficaConfigurado()) {
    return {
      error: "Agente de gráfica não configurado. Defina AGENTE_API_URL e AGENTE_API_KEY no ambiente.",
    };
  }

  const prompt = montarPromptGrafica(dados);
  const apiKey = normalizarToken(process.env.AGENTE_API_KEY!);

  try {
    const res = await fetch(process.env.AGENTE_API_URL!, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
          ? "O agente recusou a autenticação. Confira se AGENTE_API_KEY é o token puro, sem aspas, sem espaços e sem repetir 'Bearer'."
          : "O agente não respondeu corretamente.";
      return { error: erro, status: res.status, raw: data };
    }

    return {
      texto: respostaParaTexto(data),
      json: data,
    };
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Falha de rede com o agente.";
    return { error: mensagem };
  }
}
