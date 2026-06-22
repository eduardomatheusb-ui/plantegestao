import { db } from "@/lib/db";

/**
 * Dados da empresa (emitente) usados nos documentos (proposta, PI, produção).
 * Editáveis em /configuracoes/empresa. Estes valores são o PADRÃO inicial
 * (usados quando ainda não há registro salvo no banco).
 */
export const EMPRESA_PADRAO = {
  marca: "Plante Comunicação",
  razaoSocial: "Plante Ideias LTDA",
  cnpj: "48.560.442/0001-19",
  email: "larissa.prudencini@planteideias.com.br", // comercial (propostas)
  emailFinanceiro: "financeiro@planteideias.com.br", // PI / produção
  telefone: "(31) 98524-5110",
  cep: "32600-115",
  endereco: "Av. Governador Valadares, 355, sala 301 — Centro, Betim/MG",
  // Dados fiscais (NFS-e) — preenchidos ao integrar o provedor.
  inscricaoMunicipal: "",
  codigoMunicipioIbge: "3106705", // Betim/MG
  itemListaServico: "17.06", // propaganda e publicidade (LC 116/03)
  codigoTributarioMunicipio: "",
  aliquotaIss: "", // ex.: "2" (=2%)
  optanteSimplesNacional: true,
  incentivadorCultural: false,
  regimeTributario: "Simples Nacional",
  // Link do portal onde a Plante emite a NFS-e (botão "Emitir nota" no lançamento de receita).
  urlEmissaoNfse: "https://www.nfse.gov.br/EmissorNacional/",
  // Meta de receita do mês (indicadores). Vazio = sem meta definida.
  metaFaturamentoMensal: "",
};

export type EmpresaDados = typeof EMPRESA_PADRAO;

/** Dados da empresa: do banco (registro único) ou o padrão se ainda não salvo. */
export async function getEmpresa(): Promise<EmpresaDados> {
  const e = await db.empresa.findUnique({ where: { id: "singleton" } });
  if (!e) return EMPRESA_PADRAO;
  return {
    marca: e.marca,
    razaoSocial: e.razaoSocial,
    cnpj: e.cnpj,
    email: e.email,
    emailFinanceiro: e.emailFinanceiro,
    telefone: e.telefone,
    cep: e.cep,
    endereco: e.endereco,
    inscricaoMunicipal: e.inscricaoMunicipal ?? "",
    codigoMunicipioIbge: e.codigoMunicipioIbge ?? "3106705",
    itemListaServico: e.itemListaServico ?? "",
    codigoTributarioMunicipio: e.codigoTributarioMunicipio ?? "",
    aliquotaIss: e.aliquotaIss != null ? String(e.aliquotaIss) : "",
    optanteSimplesNacional: e.optanteSimplesNacional,
    incentivadorCultural: e.incentivadorCultural,
    regimeTributario: e.regimeTributario ?? "",
    urlEmissaoNfse: e.urlEmissaoNfse || EMPRESA_PADRAO.urlEmissaoNfse,
    metaFaturamentoMensal: e.metaFaturamentoMensal != null ? String(e.metaFaturamentoMensal) : "",
  };
}
