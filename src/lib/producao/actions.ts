"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertPapel } from "@/lib/rbac";
import { round2 } from "@/lib/financeiro/calculo";
import { STATUS_LABEL } from "./constants";
import type { ProducaoStatus } from "@prisma/client";

const EDITAR: "GESTOR" = "GESTOR";
const STATUS = ["EM_ABERTO", "ENVIADA", "APROVADA", "REPROVADA", "CANCELADA"];

export type ProducaoFormState = { error?: string; fieldErrors?: Record<string, string> };
export type ItemState = { error?: string };

function num(v: FormDataEntryValue | null): number {
  const x = Number(v?.toString() || "0");
  return Number.isFinite(x) ? x : 0;
}
function txt(v: FormDataEntryValue | null): string | null {
  const s = v?.toString().trim();
  return s ? s : null;
}
function data(v: FormDataEntryValue | null): Date | null {
  const s = v?.toString();
  return s ? new Date(`${s}T00:00:00`) : null;
}

async function recalcular(ordemId: string) {
  const itens = await db.producaoItem.findMany({ where: { ordemId }, select: { valorTotal: true } });
  const valorTotal = round2(itens.reduce((a, i) => a + Number(i.valorTotal), 0));
  await db.producaoOrdem.update({ where: { id: ordemId }, data: { valorTotal } });
}

// ── Ordem ─────────────────────────────────────────────────────────────

export async function salvarProducao(
  id: string | null,
  _prev: ProducaoFormState,
  formData: FormData,
): Promise<ProducaoFormState> {
  let destino = "";
  try {
    const user = await assertPapel(EDITAR);
    const titulo = formData.get("titulo")?.toString().trim();
    const clienteId = formData.get("clienteId")?.toString();
    const fieldErrors: Record<string, string> = {};
    if (!titulo) fieldErrors.titulo = "Informe o título.";
    if (!clienteId) fieldErrors.clienteId = "Selecione o cliente.";
    if (Object.keys(fieldErrors).length) return { error: "Confira os campos.", fieldErrors };

    const dados = {
      titulo: titulo!,
      clienteId: clienteId!,
      fornecedorId: txt(formData.get("fornecedorId")),
      projetoId: txt(formData.get("projetoId")),
      dataEntrega: data(formData.get("dataEntrega")),
      vencimento: data(formData.get("vencimento")),
      formaPagamento: txt(formData.get("formaPagamento")),
      comissaoPct: num(formData.get("comissaoPct")),
      versao: Math.max(1, Math.round(num(formData.get("versao")) || 1)),
      observacao: txt(formData.get("observacao")),
    };

    if (id) {
      await db.producaoOrdem.update({ where: { id }, data: dados });
      await registrarLog({ entidadeTipo: "producao", entidadeId: id, usuarioId: user.id, acao: "editou a ordem de produção" });
      destino = `/producao/${id}`;
    } else {
      const numero = await proximoNumero("PRODUCAO");
      const criada = await db.producaoOrdem.create({ data: { ...dados, numero, criadoPorId: user.id } });
      // Itens montados um a um no formulário chegam como JSON.
      let itens: { descricao?: string; quantidade?: number; valorUnit?: number }[] = [];
      try { itens = JSON.parse(formData.get("itens")?.toString() || "[]"); } catch { itens = []; }
      itens = itens.filter((i) => i && i.descricao && i.descricao.trim());
      if (itens.length) {
        await db.producaoItem.createMany({
          data: itens.map((it, idx) => {
            const q = Number(it.quantidade) || 0;
            const v = Number(it.valorUnit) || 0;
            return { ordemId: criada.id, titulo: it.descricao!.trim(), quantidade: q, valorUnit: v, valorTotal: round2(q * v), ordem: idx + 1 };
          }),
        });
        await recalcular(criada.id);
      }
      await registrarLog({ entidadeTipo: "producao", entidadeId: criada.id, usuarioId: user.id, acao: `criou a ordem de produção #${numero}` });
      destino = `/producao/${criada.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/producao");
  redirect(destino);
}

export async function alterarStatusProducao(id: string, status: ProducaoStatus) {
  const user = await assertPapel(EDITAR);
  if (!STATUS.includes(status)) throw new Error("Status inválido.");
  const atual = await db.producaoOrdem.findUnique({ where: { id }, select: { status: true } });
  await db.producaoOrdem.update({ where: { id }, data: { status } });
  await registrarLog({ entidadeTipo: "producao", entidadeId: id, usuarioId: user.id, acao: "mudou o status", de: atual ? STATUS_LABEL[atual.status] : null, para: STATUS_LABEL[status] });
  revalidatePath(`/producao/${id}`);
  revalidatePath("/producao");
}

export async function concluirProducao(id: string) {
  await alterarStatusProducao(id, "APROVADA");
}

export async function excluirProducao(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  await db.producaoOrdem.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "producao", entidadeId: id, usuarioId: user.id, acao: "excluiu a ordem de produção" });
  revalidatePath("/producao");
  redirect("/producao");
}

// ── Itens ─────────────────────────────────────────────────────────────

function lerItem(formData: FormData) {
  const titulo = formData.get("titulo")?.toString().trim();
  const quantidade = num(formData.get("quantidade")) || 0;
  const valorUnit = num(formData.get("valorUnit"));
  const valorTotal = round2(quantidade * valorUnit);
  return { titulo, quantidade, valorUnit, valorTotal };
}

export async function adicionarItemProducao(ordemId: string, _prev: ItemState, formData: FormData): Promise<ItemState> {
  await assertPapel(EDITAR);
  const d = lerItem(formData);
  if (!d.titulo) return { error: "Informe o item." };
  const ultima = await db.producaoItem.findFirst({ where: { ordemId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.producaoItem.create({
    data: { ordemId, titulo: d.titulo, quantidade: d.quantidade, valorUnit: d.valorUnit, valorTotal: d.valorTotal, ordem: (ultima?.ordem ?? 0) + 1 },
  });
  await recalcular(ordemId);
  revalidatePath(`/producao/${ordemId}`);
  return {};
}

export async function atualizarItemProducao(itemId: string, _prev: ItemState, formData: FormData): Promise<ItemState> {
  await assertPapel(EDITAR);
  const item = await db.producaoItem.findUnique({ where: { id: itemId }, select: { ordemId: true } });
  if (!item) return { error: "Item não encontrado." };
  const d = lerItem(formData);
  if (!d.titulo) return { error: "Informe o item." };
  await db.producaoItem.update({ where: { id: itemId }, data: { titulo: d.titulo, quantidade: d.quantidade, valorUnit: d.valorUnit, valorTotal: d.valorTotal } });
  await recalcular(item.ordemId);
  revalidatePath(`/producao/${item.ordemId}`);
  return {};
}

export async function removerItemProducao(itemId: string) {
  await assertPapel(EDITAR);
  const item = await db.producaoItem.findUnique({ where: { id: itemId }, select: { ordemId: true } });
  if (!item) return;
  await db.producaoItem.delete({ where: { id: itemId } });
  await recalcular(item.ordemId);
  revalidatePath(`/producao/${item.ordemId}`);
}
