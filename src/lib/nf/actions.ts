"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { emitirNfse, consultarNfse, cancelarNfse, focusConfigurado } from "./focus";
import type { FocusResultado } from "./focus";
import type { NfStatus } from "@prisma/client";

function mapStatus(r: FocusResultado): NfStatus {
  switch (r.status) {
    case "autorizado": return "AUTORIZADA";
    case "cancelado": return "CANCELADA";
    case "erro_autorizacao": return "ERRO";
    default: return r.erro && r.http >= 400 ? "ERRO" : "PROCESSANDO";
  }
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

function soDigitos(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/** Emite uma NFS-e a partir de uma Ordem de Serviço. */
export async function emitirNfseDaOs(osId: string): Promise<{ ok: boolean; erro?: string; notaId?: string }> {
  const acesso = await assertModulo("os", "EDITAR");

  const [os, empresa] = await Promise.all([
    db.ordemServico.findUnique({ where: { id: osId }, include: { cliente: true, itens: { orderBy: { ordem: "asc" } }, lancamentos: { where: { tipo: "RECEITA" }, select: { id: true } } } }),
    db.empresa.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!os) return { ok: false, erro: "OS não encontrada." };
  if (!empresa) return { ok: false, erro: "Dados da empresa não configurados." };

  const estado = await estadoFiscal();
  if (!estado.configurado) return { ok: false, erro: `Configuração fiscal incompleta: ${estado.faltando.join(", ")}. Preencha em Administração → Dados da empresa.` };
  const docTomador = soDigitos(os.cliente.documento);
  if (!docTomador) return { ok: false, erro: "O cliente desta OS está sem CNPJ/CPF — preencha no cadastro do cliente." };

  const valor = Number(os.valorTotal);
  const itensTxt = os.itens.map((i) => `• ${i.descricao}`).join("\n");
  const discriminacao = [os.titulo, itensTxt].filter(Boolean).join("\n").slice(0, 1900);

  // Referência idempotente única por OS+tentativa.
  const tentativas = await db.notaFiscal.count({ where: { osId } });
  const ref = `os-${os.numero}-${tentativas + 1}`;

  const nota = await db.notaFiscal.create({
    data: { ref, osId, clienteId: os.clienteId, status: "PROCESSANDO", valor: os.valorTotal, descricao: os.titulo, criadoPorId: acesso.id },
  });

  const tomador: Record<string, unknown> = {
    razao_social: os.cliente.nome,
    email: os.cliente.email || undefined,
    [docTomador.length > 11 ? "cnpj" : "cpf"]: docTomador,
  };
  if (os.cliente.cep) {
    tomador.endereco = {
      logradouro: os.cliente.endereco || "Não informado",
      codigo_municipio: empresa.codigoMunicipioIbge,
      cep: soDigitos(os.cliente.cep),
    };
  }

  const payload = {
    data_emissao: new Date().toISOString(),
    natureza_operacao: "1",
    optante_simples_nacional: empresa.optanteSimplesNacional,
    incentivador_cultural: empresa.incentivadorCultural,
    prestador: {
      cnpj: soDigitos(empresa.cnpj),
      inscricao_municipal: empresa.inscricaoMunicipal,
      codigo_municipio: empresa.codigoMunicipioIbge,
    },
    tomador,
    servico: {
      aliquota: Number(empresa.aliquotaIss),
      discriminacao,
      iss_retido: false,
      item_lista_servico: empresa.itemListaServico,
      codigo_tributario_municipio: empresa.codigoTributarioMunicipio || empresa.itemListaServico,
      valor_servicos: valor,
    },
  };

  const r = await emitirNfse(ref, payload);
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
      // já vincula ao lançamento de receita da OS, se houver
      lancamentoId: os.lancamentos[0]?.id ?? null,
    },
  });
  await registrarLog({ entidadeTipo: "os", entidadeId: osId, usuarioId: acesso.id, acao: "solicitou emissão de NFS-e", para: novoStatus });
  revalidatePath(`/os/${osId}`);
  return { ok: novoStatus !== "ERRO", erro: novoStatus === "ERRO" ? (r.erro ?? "Provedor não configurado.") : undefined, notaId: nota.id };
}

/** Consulta o provedor e atualiza a situação da nota (PROCESSANDO → AUTORIZADA/ERRO). */
export async function sincronizarNfse(notaId: string): Promise<void> {
  await assertModulo("os", "VER");
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
}

/** Cancela uma NFS-e autorizada (justificativa mínima de 15 caracteres exigida pelo provedor). */
export async function cancelarNfseDaOs(notaId: string, justificativa: string): Promise<{ ok: boolean; erro?: string }> {
  const acesso = await assertModulo("os", "EDITAR");
  const just = justificativa.trim();
  if (just.length < 15) return { ok: false, erro: "A justificativa precisa ter pelo menos 15 caracteres." };
  const nota = await db.notaFiscal.findUnique({ where: { id: notaId } });
  if (!nota) return { ok: false, erro: "Nota não encontrada." };
  const r = await cancelarNfse(nota.ref, just);
  if (!r.configurado) return { ok: false, erro: "Provedor não configurado." };
  if (r.http >= 400 && r.erro) return { ok: false, erro: r.erro };
  await db.notaFiscal.update({ where: { id: notaId }, data: { status: "CANCELADA", mensagemErro: null } });
  await registrarLog({ entidadeTipo: "os", entidadeId: nota.osId ?? notaId, usuarioId: acesso.id, acao: "cancelou NFS-e", para: just.slice(0, 80) });
  if (nota.osId) revalidatePath(`/os/${nota.osId}`);
  return { ok: true };
}
