import "server-only";

/**
 * Camada de IA (API da Anthropic, via HTTP — sem SDK).
 * Plugável: se ANTHROPIC_API_KEY não estiver configurada, vira no-op
 * (o recurso aparece como "indisponível"). NUNCA lança.
 * A IA gera apenas SUGESTÕES — o texto exige revisão humana antes de qualquer uso oficial.
 */

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const MODELO_PADRAO = "claude-haiku-4-5";

export function iaConfigurada(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

/** Gera texto a partir de um system prompt + instrução. Retorna null em falha/sem chave. */
export async function gerarTextoIA(system: string, prompt: string, maxTokens = 1024): Promise<string | null> {
  if (!iaConfigurada()) return null;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || MODELO_PADRAO,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) {
      console.error("[ia] Anthropic respondeu", res.status, await res.text().catch(() => ""));
      return null;
    }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const texto = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
    return texto || null;
  } catch (err) {
    console.error("[ia] falha ao gerar (ignorada):", err);
    return null;
  }
}
