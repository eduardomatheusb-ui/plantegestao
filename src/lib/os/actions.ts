"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertModulo } from "@/lib/permissoes.server";
import { round2 } from "@/lib/financeiro/calculo";
import { STATUS_LABEL } from "./constants";
import type { OsStatus } from "@prisma/client";

const STATUS = ["RASCUNHO", "EMITIDA", "PAGA", "CANCELADA"];

export type OsFormState = { error?: string; fieldErrors?: Record<string, string> };
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

async function recalcular(osId: string) {
  const itens = await db.ordemServicoItem.findMany({ where: { osId }, select: { valorTotal: true } });
  const valorTotal = round2(itens.reduce((a, i) => a + Number(i.valorTotal), 0));
  await db.ordemServico.update({ where: { id: osId }, data: { valorTotal } });
}

// ── Ordem de serviço ──────────────────────────────────────────────────

export async function salvarOs(
  id: string | null,
  _prev: OsFormState,
  formData: FormData,
): Promise<OsFormState> {
  let destino = "";
  try {
    const acesso = await assertModulo("os", "EDITAR");
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
      vencimento: data(formData.get("vencimento")),
      formaPagamento: txt(formData.get("formaPagamento")),
      condicoesPagamento: txt(formData.get("condicoesPagamento")),
      observacao: txt(formData.get("observacao")),
    };

    if (id) {
      await db.ordemServico.update({ where: { id }, data: dados });
      await registrarLog({ entidadeTipo: "os", entidadeId: id, usuarioId: acesso.id, acao: "editou a ordem de serviço" });
      destino = `/os/${id}`;
    } else {
      const numero = await proximoNumero("OS");
      const criada = await db.ordemServico.create({ data: { ...dados, numero, responsavelId: acesso.id, criadoPorId: acesso.id } });
      // Itens montados no formulário (um a um) chegam como JSON.
      let itens: { descricao?: string; quantidade?: number; valorUnit?: number }[] = [];
      try { itens = JSON.parse(formData.get("itens")?.toString() || "[]"); } catch { itens = []; }
      itens = itens.filter((i) => i && i.descricao && i.descricao.trim());
      if (itens.length) {
        await db.ordemServicoItem.createMany({
          data: itens.map((it, idx) => {
            const q = Number(it.quantidade) || 0;
            const v = Number(it.valorUnit) || 0;
            return { osId: criada.id, descricao: it.descricao!.trim(), quantidade: q, valorUnit: v, valorTotal: round2(q * v), ordem: idx + 1 };
          }),
        });
        await recalcular(criada.id);
      }
      await registrarLog({ entidadeTipo: "os", entidadeId: criada.id, usuarioId: acesso.id, acao: `criou a ordem de serviço #${numero}` });
      destino = `/os/${criada.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/os");
  redirect(destino);
}

export async function alterarStatusOs(id: string, status: OsStatus) {
  const acesso = await assertModulo("os", "EDITAR");
  if (!STATUS.includes(status)) throw new Error("Status inválido.");
  const atual = await db.ordemServico.findUnique({ where: { id }, select: { status: true } });
  await db.ordemServico.update({ where: { id }, data: { status } });
  // Quando a OS é marcada como Paga, quita o lançamento financeiro vinculado.
  if (status === "PAGA") {
    await db.lancamento.updateMany({ where: { osId: id, status: "EM_ABERTO" }, data: { status: "QUITADO", dataPagamento: new Date() } });
    revalidatePath("/financeiro");
  }
  await registrarLog({ entidadeTipo: "os", entidadeId: id, usuarioId: acesso.id, acao: "mudou o status", de: atual ? STATUS_LABEL[atual.status] : null, para: STATUS_LABEL[status] });
  revalidatePath(`/os/${id}`);
  revalidatePath("/os");
}

/**
 * Gera (ou abre) o lançamento de RECEITA no Financeiro a partir da OS.
 * Idempotente: se já houver lançamento vinculado, vai direto pro mês dele.
 */
export async function gerarLancamentoDaOs(osId: string) {
  const acesso = await assertModulo("os", "EDITAR");
  const os = await db.ordemServico.findUnique({
    where: { id: osId },
    include: { lancamentos: { select: { id: true, dataCompetencia: true } } },
  });
  if (!os) throw new Error("Ordem de serviço não encontrada.");

  const mesDe = (d: Date) => `?ano=${d.getFullYear()}&mes=${d.getMonth() + 1}`;
  if (os.lancamentos.length > 0) redirect(`/financeiro${mesDe(os.lancamentos[0].dataCompetencia)}`);

  const numero = await proximoNumero("LANCAMENTO");
  const competencia = os.dataEmissao;
  const paga = os.status === "PAGA";
  // Categoria-padrão de receita de serviços (se existir no plano de contas).
  const categoria = await db.categoria.findFirst({
    where: { tipo: "RECEITA", nome: "Receita de serviços" },
    select: { id: true },
  });
  await db.lancamento.create({
    data: {
      numero,
      tipo: "RECEITA",
      titulo: `OS #${os.numero} — ${os.titulo}`,
      clienteId: os.clienteId,
      projetoId: os.projetoId,
      categoriaId: categoria?.id ?? null,
      osId: os.id,
      docNf: `OS #${os.numero}`,
      dataVencimento: os.vencimento ?? competencia,
      dataCompetencia: competencia,
      dataPagamento: paga ? new Date() : null,
      valor: os.valorTotal,
      status: paga ? "QUITADO" : "EM_ABERTO",
      criadoPorId: acesso.id,
    },
  });
  await registrarLog({ entidadeTipo: "os", entidadeId: os.id, usuarioId: acesso.id, acao: "lançou no financeiro", para: `OS #${os.numero}` });
  revalidatePath(`/os/${os.id}`);
  revalidatePath("/financeiro");
  redirect(`/financeiro${mesDe(competencia)}`);
}

export async function excluirOs(id: string) {
  const acesso = await assertModulo("os", "ADMIN");
  await db.ordemServico.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "os", entidadeId: id, usuarioId: acesso.id, acao: "excluiu a ordem de serviço" });
  revalidatePath("/os");
  redirect("/os");
}

// ── Itens ─────────────────────────────────────────────────────────────

function lerItem(formData: FormData) {
  const descricao = formData.get("descricao")?.toString().trim();
  const quantidade = num(formData.get("quantidade")) || 0;
  const valorUnit = num(formData.get("valorUnit"));
  const valorTotal = round2(quantidade * valorUnit);
  return { descricao, quantidade, valorUnit, valorTotal };
}

export async function adicionarItemOs(osId: string, _prev: ItemState, formData: FormData): Promise<ItemState> {
  await assertModulo("os", "EDITAR");
  const d = lerItem(formData);
  if (!d.descricao) return { error: "Informe o item." };
  const ultima = await db.ordemServicoItem.findFirst({ where: { osId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.ordemServicoItem.create({
    data: { osId, descricao: d.descricao, quantidade: d.quantidade, valorUnit: d.valorUnit, valorTotal: d.valorTotal, ordem: (ultima?.ordem ?? 0) + 1 },
  });
  await recalcular(osId);
  revalidatePath(`/os/${osId}`);
  return {};
}

export async function atualizarItemOs(itemId: string, _prev: ItemState, formData: FormData): Promise<ItemState> {
  await assertModulo("os", "EDITAR");
  const item = await db.ordemServicoItem.findUnique({ where: { id: itemId }, select: { osId: true } });
  if (!item) return { error: "Item não encontrado." };
  const d = lerItem(formData);
  if (!d.descricao) return { error: "Informe o item." };
  await db.ordemServicoItem.update({ where: { id: itemId }, data: { descricao: d.descricao, quantidade: d.quantidade, valorUnit: d.valorUnit, valorTotal: d.valorTotal } });
  await recalcular(item.osId);
  revalidatePath(`/os/${item.osId}`);
  return {};
}

export async function removerItemOs(itemId: string) {
  await assertModulo("os", "EDITAR");
  const item = await db.ordemServicoItem.findUnique({ where: { id: itemId }, select: { osId: true } });
  if (!item) return;
  await db.ordemServicoItem.delete({ where: { id: itemId } });
  await recalcular(item.osId);
  revalidatePath(`/os/${item.osId}`);
}
