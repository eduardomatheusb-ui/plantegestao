"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertPapel } from "@/lib/rbac";
import { calcularSubtotal, calcularTotal } from "./calculo";
import { STATUS_LABEL } from "./status";
import type { PropostaStatus } from "@prisma/client";

const EDITAR: "GESTOR" = "GESTOR";

export type PropostaFormState = { error?: string; fieldErrors?: Record<string, string> };
export type ItemState = { error?: string };

const STATUS_VALUES = ["EM_ABERTO", "ENVIADA", "APROVADA", "REPROVADA", "EXPIRADA"] as const;

/** Recalcula e persiste o total da proposta (soma dos itens visíveis). */
async function recalcularTotal(propostaId: string) {
  const itens = await db.propostaItem.findMany({
    where: { propostaId },
    select: { valorUnit: true, quantidade: true, desconto: true, visivel: true },
  });
  const total = calcularTotal(
    itens.map((i) => ({
      valorUnit: Number(i.valorUnit),
      quantidade: Number(i.quantidade),
      desconto: Number(i.desconto),
      visivel: i.visivel,
    })),
  );
  await db.proposta.update({ where: { id: propostaId }, data: { valorTotal: total } });
}

// ── Proposta ──────────────────────────────────────────────────────────

const propostaSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título."),
  clienteId: z.string().trim().min(1, "Selecione o cliente."),
  projetoId: z.string().optional().transform((v) => (v ? v : null)),
  responsavelId: z.string().optional().transform((v) => (v ? v : null)),
  validadeDias: z.coerce.number().int().min(0).default(30),
  versao: z.coerce.number().int().min(1).default(1),
  prazo: z.string().optional().transform((v) => (v ? new Date(`${v}T00:00:00`) : null)),
});

export async function salvarProposta(
  id: string | null,
  _prev: PropostaFormState,
  formData: FormData,
): Promise<PropostaFormState> {
  let destino = "";
  try {
    const user = await assertPapel(EDITAR);
    const parsed = propostaSchema.safeParse({
      titulo: formData.get("titulo")?.toString(),
      clienteId: formData.get("clienteId")?.toString(),
      projetoId: formData.get("projetoId")?.toString(),
      responsavelId: formData.get("responsavelId")?.toString(),
      validadeDias: formData.get("validadeDias")?.toString() || "30",
      versao: formData.get("versao")?.toString() || "1",
      prazo: formData.get("prazo")?.toString(),
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0];
        if (typeof k === "string" && !fieldErrors[k]) fieldErrors[k] = issue.message;
      }
      return { error: "Confira os campos destacados.", fieldErrors };
    }
    const d = parsed.data;
    const data = {
      titulo: d.titulo,
      clienteId: d.clienteId,
      projetoId: d.projetoId,
      responsavelId: d.responsavelId,
      validadeDias: d.validadeDias,
      versao: d.versao,
      prazo: d.prazo,
    };
    if (id) {
      await db.proposta.update({ where: { id }, data });
      await registrarLog({ entidadeTipo: "proposta", entidadeId: id, usuarioId: user.id, acao: "editou a proposta" });
      destino = `/propostas/${id}`;
    } else {
      const numero = await proximoNumero("PROPOSTA");
      const criada = await db.proposta.create({ data: { ...data, numero, responsavelId: d.responsavelId ?? user.id, criadoPorId: user.id } });
      await registrarLog({ entidadeTipo: "proposta", entidadeId: criada.id, usuarioId: user.id, acao: `criou a proposta #${numero}` });
      destino = `/propostas/${criada.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar a proposta." };
  }
  revalidatePath("/propostas");
  redirect(destino);
}

export async function alterarStatusProposta(id: string, status: PropostaStatus) {
  const user = await assertPapel(EDITAR);
  if (!STATUS_VALUES.includes(status)) throw new Error("Status inválido.");
  const atual = await db.proposta.findUnique({ where: { id }, select: { status: true } });
  await db.proposta.update({ where: { id }, data: { status } });
  await registrarLog({
    entidadeTipo: "proposta",
    entidadeId: id,
    usuarioId: user.id,
    acao: "mudou o status",
    de: atual ? STATUS_LABEL[atual.status] : null,
    para: STATUS_LABEL[status],
  });
  revalidatePath(`/propostas/${id}`);
  revalidatePath("/propostas");
}

export async function concluirProposta(id: string) {
  await alterarStatusProposta(id, "APROVADA");
}

export async function atualizarIntroducao(id: string, formData: FormData) {
  await assertPapel(EDITAR);
  const introducao = formData.get("introducao")?.toString() ?? "";
  await db.proposta.update({ where: { id }, data: { introducao: introducao.trim() || null } });
  revalidatePath(`/propostas/${id}`);
}

export async function atualizarConsideracoes(id: string, formData: FormData) {
  await assertPapel(EDITAR);
  const texto = formData.get("consideracoesFinais")?.toString() ?? "";
  await db.proposta.update({ where: { id }, data: { consideracoesFinais: texto.trim() || null } });
  revalidatePath(`/propostas/${id}`);
}

export async function excluirProposta(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  await db.proposta.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "proposta", entidadeId: id, usuarioId: user.id, acao: "excluiu a proposta" });
  revalidatePath("/propostas");
  redirect("/propostas");
}

/**
 * Cria um Projeto a partir da proposta (cliente, título → nome, introdução → briefing)
 * e vincula a proposta ao projeto criado. Se já houver projeto, só redireciona pra ele.
 */
export async function gerarProjetoDaProposta(propostaId: string) {
  const user = await assertPapel(EDITAR);
  const proposta = await db.proposta.findUnique({ where: { id: propostaId } });
  if (!proposta) throw new Error("Proposta não encontrada.");
  if (proposta.projetoId) redirect(`/projetos/${proposta.projetoId}`);

  const numero = await proximoNumero("PROJETO");
  const projeto = await db.projeto.create({
    data: {
      numero,
      nome: proposta.titulo,
      clienteId: proposta.clienteId,
      responsavelId: proposta.responsavelId ?? user.id,
      criadoPorId: user.id,
      briefing: proposta.introducao ?? null,
    },
  });
  await db.proposta.update({ where: { id: propostaId }, data: { projetoId: projeto.id } });
  await registrarLog({ entidadeTipo: "projeto", entidadeId: projeto.id, usuarioId: user.id, acao: `gerou a partir da proposta #${proposta.numero}` });
  await registrarLog({ entidadeTipo: "proposta", entidadeId: propostaId, usuarioId: user.id, acao: `vinculou ao projeto #${numero}` });
  revalidatePath("/projetos");
  revalidatePath(`/propostas/${propostaId}`);
  redirect(`/projetos/${projeto.id}`);
}

// ── Itens ─────────────────────────────────────────────────────────────

const itemSchema = z.object({
  produtoId: z.string().optional().transform((v) => (v ? v : null)),
  nome: z.string().trim().min(1, "Informe o item."),
  descricao: z.string().optional().transform((v) => (v && v.trim() ? v : null)),
  valorUnit: z.coerce.number().min(0, "Valor inválido."),
  quantidade: z.coerce.number().min(0, "Quantidade inválida.").default(1),
  desconto: z.coerce.number().min(0, "Desconto inválido.").default(0),
  visivel: z.boolean().default(true),
});

function lerItem(formData: FormData) {
  return itemSchema.safeParse({
    produtoId: formData.get("produtoId")?.toString(),
    nome: formData.get("nome")?.toString(),
    descricao: formData.get("descricao")?.toString(),
    valorUnit: formData.get("valorUnit")?.toString() || "0",
    quantidade: formData.get("quantidade")?.toString() || "1",
    desconto: formData.get("desconto")?.toString() || "0",
    visivel: formData.get("visivel") === "on", // checkbox: "on" quando marcado
  });
}

export async function adicionarItem(
  propostaId: string,
  _prev: ItemState,
  formData: FormData,
): Promise<ItemState> {
  await assertPapel(EDITAR);
  const parsed = lerItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;
  const subtotal = calcularSubtotal(d.valorUnit, d.quantidade, d.desconto);
  const ultima = await db.propostaItem.findFirst({ where: { propostaId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.propostaItem.create({
    data: {
      propostaId,
      produtoId: d.produtoId,
      nome: d.nome,
      descricao: d.descricao,
      valorUnit: d.valorUnit,
      quantidade: d.quantidade,
      desconto: d.desconto,
      subtotal,
      visivel: d.visivel,
      ordem: (ultima?.ordem ?? 0) + 1,
    },
  });
  await recalcularTotal(propostaId);
  revalidatePath(`/propostas/${propostaId}`);
  return {};
}

export async function atualizarItem(
  itemId: string,
  _prev: ItemState,
  formData: FormData,
): Promise<ItemState> {
  await assertPapel(EDITAR);
  const item = await db.propostaItem.findUnique({ where: { id: itemId }, select: { propostaId: true } });
  if (!item) return { error: "Item não encontrado." };
  const parsed = lerItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  const d = parsed.data;
  const subtotal = calcularSubtotal(d.valorUnit, d.quantidade, d.desconto);
  await db.propostaItem.update({
    where: { id: itemId },
    data: {
      nome: d.nome,
      descricao: d.descricao,
      valorUnit: d.valorUnit,
      quantidade: d.quantidade,
      desconto: d.desconto,
      subtotal,
      visivel: d.visivel,
    },
  });
  await recalcularTotal(item.propostaId);
  revalidatePath(`/propostas/${item.propostaId}`);
  return {};
}

export async function removerItem(itemId: string) {
  await assertPapel(EDITAR);
  const item = await db.propostaItem.findUnique({ where: { id: itemId }, select: { propostaId: true } });
  if (!item) return;
  await db.propostaItem.delete({ where: { id: itemId } });
  await recalcularTotal(item.propostaId);
  revalidatePath(`/propostas/${item.propostaId}`);
}

export async function toggleItemVisivel(itemId: string) {
  await assertPapel(EDITAR);
  const item = await db.propostaItem.findUnique({ where: { id: itemId }, select: { propostaId: true, visivel: true } });
  if (!item) return;
  await db.propostaItem.update({ where: { id: itemId }, data: { visivel: !item.visivel } });
  await recalcularTotal(item.propostaId);
  revalidatePath(`/propostas/${item.propostaId}`);
}

export async function reordenarItem(itemId: string, direcao: "cima" | "baixo") {
  await assertPapel(EDITAR);
  const item = await db.propostaItem.findUnique({ where: { id: itemId }, select: { propostaId: true } });
  if (!item) return;
  const lista = await db.propostaItem.findMany({ where: { propostaId: item.propostaId }, orderBy: { ordem: "asc" } });
  const idx = lista.findIndex((i) => i.id === itemId);
  const alvo = direcao === "cima" ? idx - 1 : idx + 1;
  if (alvo < 0 || alvo >= lista.length) return;
  await db.$transaction([
    db.propostaItem.update({ where: { id: lista[idx].id }, data: { ordem: lista[alvo].ordem } }),
    db.propostaItem.update({ where: { id: lista[alvo].id }, data: { ordem: lista[idx].ordem } }),
  ]);
  revalidatePath(`/propostas/${item.propostaId}`);
}
