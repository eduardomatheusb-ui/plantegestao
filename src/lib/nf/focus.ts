import "server-only";

/**
 * Cliente da API do Focus NFe (NFS-e). Documentação: https://focusnfe.com.br/doc/
 * Autenticação: HTTP Basic com o TOKEN como usuário e senha em branco.
 * Ambiente controlado por env (homologação por padrão — não emite nota real).
 *
 * Variáveis de ambiente:
 *   FOCUS_NFE_TOKEN     — token da conta (env do Netlify)
 *   FOCUS_NFE_AMBIENTE  — "homologacao" (padrão) | "producao"
 *   FOCUS_NFE_MODELO    — "nacional" (padrão; NFS-e Nacional, /v2/nfsen) | "municipal" (/v2/nfse)
 *
 * Betim/MG aderiu à NFS-e Nacional (2026) e autentica por LOGIN/SENHA da prefeitura
 * (cadastrados no painel da Focus, por empresa) — não por certificado.
 */

function baseFocus(): string {
  const amb = (process.env.FOCUS_NFE_AMBIENTE || "homologacao").toLowerCase();
  return amb === "producao" ? "https://api.focusnfe.com.br" : "https://homologacao.focusnfe.com.br";
}

/** Recurso da API: NFS-e Nacional (/v2/nfsen) por padrão; municipal antigo se configurado. */
function recurso(): string {
  return (process.env.FOCUS_NFE_MODELO || "nacional").toLowerCase() === "municipal" ? "/v2/nfse" : "/v2/nfsen";
}

export function focusConfigurado(): boolean {
  return !!process.env.FOCUS_NFE_TOKEN;
}

export function focusEmHomologacao(): boolean {
  return (process.env.FOCUS_NFE_AMBIENTE || "homologacao").toLowerCase() !== "producao";
}

export type FocusResultado = {
  configurado: boolean;
  http: number;
  status?: string; // status do provedor: processando_autorizacao | autorizado | erro_autorizacao | cancelado
  numero?: string;
  codigoVerificacao?: string;
  urlPdf?: string;
  urlXml?: string;
  erro?: string;
  raw?: unknown;
};

function authHeader(): string {
  const token = process.env.FOCUS_NFE_TOKEN ?? "";
  return "Basic " + Buffer.from(`${token}:`).toString("base64");
}

function extrair(data: Record<string, unknown> | null, http: number): FocusResultado {
  if (!data) return { configurado: true, http };
  const base = baseFocus();
  const caminhoXml = (data["caminho_xml_nota_fiscal"] as string) || "";
  const erros = data["erros"] as Array<{ mensagem?: string }> | undefined;
  const erro =
    (data["mensagem"] as string) ||
    (Array.isArray(erros) && erros.length ? erros.map((e) => e.mensagem).filter(Boolean).join("; ") : undefined);
  return {
    configurado: true,
    http,
    status: data["status"] as string | undefined,
    numero: (data["numero"] as string) || undefined,
    codigoVerificacao: (data["codigo_verificacao"] as string) || undefined,
    urlPdf: (data["url"] as string) || undefined,
    urlXml: caminhoXml ? `${base}${caminhoXml}` : undefined,
    erro,
    raw: data,
  };
}

async function req(method: string, path: string, body?: unknown): Promise<FocusResultado> {
  if (!focusConfigurado()) return { configurado: false, http: 0, erro: "Provedor não configurado (defina FOCUS_NFE_TOKEN)." };
  try {
    const res = await fetch(`${baseFocus()}${path}`, {
      method,
      headers: { Authorization: authHeader(), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const txt = await res.text();
    let data: Record<string, unknown> | null = null;
    try { data = txt ? JSON.parse(txt) : null; } catch { data = { mensagem: txt }; }
    return extrair(data, res.status);
  } catch (err) {
    return { configurado: true, http: 0, erro: err instanceof Error ? err.message : "Falha de rede com o provedor." };
  }
}

export function emitirNfse(ref: string, payload: unknown): Promise<FocusResultado> {
  return req("POST", `${recurso()}?ref=${encodeURIComponent(ref)}`, payload);
}

export function consultarNfse(ref: string): Promise<FocusResultado> {
  return req("GET", `${recurso()}/${encodeURIComponent(ref)}`);
}

export function cancelarNfse(ref: string, justificativa: string): Promise<FocusResultado> {
  return req("DELETE", `${recurso()}/${encodeURIComponent(ref)}`, { justificativa });
}
