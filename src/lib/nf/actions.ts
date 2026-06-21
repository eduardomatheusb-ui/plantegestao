"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { valorEfetivo } from "@/lib/financeiro/calculo";
import { emitirNfse, consultarNfse, cancelarNfse, focusConfigurado } from "./focus";
import type { FocusResultado } from "./focus";
import type { NfStatus, Cliente, Empresa } from "@prisma/client";

function mapStatus(r: FocusResultado): NfStatus {
  switch (r.status) {
    case "autorizado": return "AUTORIZADA";
    case "cancelado": return "CANCELADA";
    case "erro_autorizacao": return "ERRO";
    default: return r.erro && r.http >= 400 ? "ERRO" : "PROCESSANDO";
  }
}

function soDigitos(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/** Confere se a empresa tem os dados fiscais mínimos para emitir. */
export async function estadoFiscal(): Promise<{ configurado: boolean; provedor: boolean; faltando: string[] }> {
  const e = await db.empresa.findUnique({ where: { id: "singleton" } });
  const faltando: string[] = [];
  if (!e?.cnpj) faltando.push("CNPJ da empresa");
  if (!e?.inscricaoMunicipal) faltando.push("Inscrição municipal");
  if (!e?.codigoMunicipioIbge) faltando.push("Código IBGE do município");
  if (!e?.itemListaServico) faltando.push("Item da lista de serviço (LC 116)");
  if (e?.aliquotaIss == null) faltando.push("Alíquota de ISS");
  return { configurado: faltando.length === 0, provedor: focusConfigurado(), faltando };
}

type EmitirOpts = {
  ref: string;
  cliente: Cliente;
  empresa: Empresa;
  valor: number;
  descricao: string; // resumo curto guardado na NotaFiscal
  discriminacao: string; // texto completo enviado ao provedor
  osId?: string | null;
  lancamentoId?: string | null;
  criadoPorId?: string | null;
};

/** Núcleo de emissão: valida, cria o registro, chama o provedor e atualiza. */
async function emitirNotaPara(opts: EmitirOpts): Promise<{ ok: boolean; erro?: string; notaId?: string }> {
  const estado = await estadoFiscal();
  if (!estado.configurado) return { ok: false, erro: `Configuração fiscal incompleta: ${estado.faltando.join(", ")}. Preencha em Administração → Dados da empresa.` };
  const docTomador = soDigitos(opts.cliente.documento);
  if (!docTomador) return { ok: false, erro: "O cliente está sem CNPJ/CPF — preencha no cadastro do cliente." };
  if (opts.valor <= 0) return { ok: false, erro: "Valor inválido para emissão da nota." };

  const { empresa, cliente } = opts;
  const nota = await db.notaFiscal.create({
    data: { ref: opts.ref, osId: opts.osId ?? null, lancamentoId: opts.lancamentoId ?? null, clienteId: cliente.id, status: "PROCESSANDO", valor: opts.valor, descricao: opts.descricao.slice(0, 200), criadoPorId: opts.criadoPorId ?? null },
  });

  // Payload NFS-e Nacional (Focus /v2/nfsen) — estrutura "achatada" (Betim aderiu ao padrão nacional).
  // Campos com código nacional (codigo_tributacao_nacional_iss, regime, PIS/COFINS) e a
  // parametrização da empresa são finalizados no PAINEL DA FOCUS + validados em homologação.
  const ehCnpj = docTomador.length > 11;
  const payload: Record<string, unknown> = {
    data_emissao: new Date().toISOString(),
    // Prestador (Plante)
    cnpj_prestador: soDigitos(empresa.cnpj),
    email_prestador: empresa.email || undefined,
    // Tomador (cliente)
    [ehCnpj ? "cnpj_tomador" : "cpf_tomador"]: docTomador,
    razao_social_tomador: cliente.nome,
    email_tomador: cliente.email || undefined,
    logradouro_tomador: cliente.endereco || undefined,
    cep_tomador: cliente.cep ? soDigitos(cliente.cep) : undefined,
    // Serviço
    codigo_municipio_prestacao: empresa.codigoMunicipioIbge,
    codigo_tributacao_nacional_iss: empresa.codigoTributarioMunicipio || empresa.itemListaServico,
    descricao_servico: opts.discriminacao.slice(0, 1900),
    valor_servico: opts.valor,
    aliquota: empresa.aliquotaIss != null ? Number(empresa.aliquotaIss) : undefined,
    iss_retido: false,
    // Simples Nacional: 1 = optante, 2 = não optante
    codigo_opcao_simples_nacional: empresa.optanteSimplesNacional ? 1 : 2,
  };

  const r = await emitirNfse(opts.ref, payload);
  const novoStatus = r.configurado ? mapStatus(r) : "ERRO";
  await db.notaFiscal.update({
    where: { id: nota.id },
    data: {
      status: novoStatus,
      numero: r.numero ?? null,
      codigoVerificacao: r.codigoVerificacao ?? null,
      urlPdf: r.urlPdf ?? null,
      urlXml: r.urlXml ?? null,
      mensagemErro: r.configurado ? r.erro ?? null : "Provedor não configurado (FOCUS_NFE_TOKEN ausente).",
    },
  });
  return { ok: novoStatus !== "ERRO", erro: novoStatus === "ERRO" ? (r.erro ?? "Provedor não configurado.") : undefined, notaId: nota.id };
}

/** Emite uma NFS-e a partir de uma Ordem de Serviço. */
export async function emitirNfseDaOs(osId: string): Promise<{ ok: boolean; erro?: string; notaId?: string }> {
  const acesso = await assertModulo("os", "EDITAR");
  const os = await db.ordemServico.findUnique({ where: { id: osId }, include: { cliente: true, itens: { orderBy: { ordem: "asc" } }, lancamentos: { where: { tipo: "RECEITA" }, select: { id: true } } } });
  if (!os) return { ok: false, erro: "OS não encontrada." };
  const empresa = await db.empresa.findUnique({ where: { id: "singleton" } });
  if (!empresa) return { ok: false, erro: "Dados da empresa não configurados." };

  const tentativas = await db.notaFiscal.count({ where: { osId } });
  const ref = `os-${os.numero}-${tentativas + 1}`;
  const itensTxt = os.itens.map((i) => `• ${i.descricao}`).join("\n");

  const res = await emitirNotaPara({
    ref, cliente: os.cliente, empresa, valor: Number(os.valorTotal),
    descricao: os.titulo,
    discriminacao: [os.titulo, itensTxt].filter(Boolean).join("\n"),
    osId, lancamentoId: os.lancamentos[0]?.id ?? null, criadoPorId: acesso.id,
  });
  await registrarLog({ entidadeTipo: "os", entidadeId: osId, usuarioId: acesso.id, acao: "solicitou emissão de NFS-e", para: res.ok ? "PROCESSANDO/AUTORIZADA" : "ERRO" });
  revalidatePath(`/os/${osId}`);
  return res;
}

/** Emite uma NFS-e a partir de um lançamento financeiro de RECEITA. */
export async function emitirNfseDoLancamento(lancamentoId: string): Promise<{ ok: boolean; erro?: string; notaId?: string }> {
  const acesso = await assertModulo("financeiro", "EDITAR");
  const lanc = await db.lancamento.findUnique({ where: { id: lancamentoId }, include: { cliente: true } });
  if (!lanc) return { ok: false, erro: "Lançamento não encontrado." };
  if (lanc.tipo !== "RECEITA") return { ok: false, erro: "Só é possível emitir NFS-e de um lançamento de receita." };
  if (!lanc.cliente) return { ok: false, erro: "Este lançamento está sem cliente — defina o cliente para emitir a nota." };
  const empresa = await db.empresa.findUnique({ where: { id: "singleton" } });
  if (!empresa) return { ok: false, erro: "Dados da empresa não configurados." };

  const tentativas = await db.notaFiscal.count({ where: { lancamentoId, osId: null } });
  const ref = `lanc-${lanc.numero}-${tentativas + 1}`;
  const valor = valorEfetivo(Number(lanc.valor), Number(lanc.acrescimos), Number(lanc.descontos));

  const res = await emitirNotaPara({
    ref, cliente: lanc.cliente, empresa, valor,
    descricao: lanc.titulo,
    discriminacao: [lanc.titulo, lanc.observacao].filter(Boolean).join("\n"),
    lancamentoId, criadoPorId: acesso.id,
  });
  await registrarLog({ entidadeTipo: "lancamento", entidadeId: lancamentoId, usuarioId: acesso.id, acao: "solicitou emissão de NFS-e", para: res.ok ? "PROCESSANDO/AUTORIZADA" : "ERRO" });
  revalidatePath(`/financeiro/${lancamentoId}`);
  return res;
}

/** Consulta o provedor e atualiza a situação da nota (PROCESSANDO → AUTORIZADA/ERRO). */
export async function sincronizarNfse(notaId: string): Promise<void> {
  await assertModulo("os", "VER").catch(() => assertModulo("financeiro", "VER"));
  const nota = await db.notaFiscal.findUnique({ where: { id: notaId } });
  if (!nota) return;
  const r = await consultarNfse(nota.ref);
  if (!r.configurado) return;
  await db.notaFiscal.update({
    where: { id: notaId },
    data: {
      status: mapStatus(r),
      numero: r.numero ?? nota.numero,
      codigoVerificacao: r.codigoVerificacao ?? nota.codigoVerificacao,
      urlPdf: r.urlPdf ?? nota.urlPdf,
      urlXml: r.urlXml ?? nota.urlXml,
      mensagemErro: r.erro ?? null,
    },
  });
  if (nota.osId) revalidatePath(`/os/${nota.osId}`);
  if (nota.lancamentoId) revalidatePath(`/financeiro/${nota.lancamentoId}`);
}

/** Cancela uma NFS-e autorizada (justificativa mínima de 15 caracteres exigida pelo provedor). */
export async function cancelarNfseDaOs(notaId: string, justificativa: string): Promise<{ ok: boolean; erro?: string }> {
  const acesso = await assertModulo("os", "VER").catch(() => assertModulo("financeiro", "EDITAR"));
  const just = justificativa.trim();
  if (just.length < 15) return { ok: false, erro: "A justificativa precisa ter pelo menos 15 caracteres." };
  const nota = await db.notaFiscal.findUnique({ where: { id: notaId } });
  if (!nota) return { ok: false, erro: "Nota não encontrada." };
  const r = await cancelarNfse(nota.ref, just);
  if (!r.configurado) return { ok: false, erro: "Provedor não configurado." };
  if (r.http >= 400 && r.erro) return { ok: false, erro: r.erro };
  await db.notaFiscal.update({ where: { id: notaId }, data: { status: "CANCELADA", mensagemErro: null } });
  await registrarLog({ entidadeTipo: nota.osId ? "os" : "lancamento", entidadeId: nota.osId ?? nota.lancamentoId ?? notaId, usuarioId: acesso.id, acao: "cancelou NFS-e", para: just.slice(0, 80) });
  if (nota.osId) revalidatePath(`/os/${nota.osId}`);
  if (nota.lancamentoId) revalidatePath(`/financeiro/${nota.lancamentoId}`);
  return { ok: true };
}
