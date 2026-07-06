"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertPapel } from "@/lib/rbac";
import type { LancamentoTipo } from "@prisma/client";

const EDITAR: "GESTOR" = "GESTOR";

export type LancamentoFormState = { error?: string; fieldErrors?: Record<string, string> };

function data(v: FormDataEntryValue | null): Date | null {
  const s = v?.toString();
  return s ? new Date(`${s}T00:00:00`) : null;
}
function num(v: FormDataEntryValue | null): number {
  const n = Number(v?.toString() || "0");
  return Number.isFinite(n) ? n : 0;
}
function txt(v: FormDataEntryValue | null): string | null {
  const s = v?.toString().trim();
  return s ? s : null;
}
function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

export async function salvarLancamento(
  id: string | null,
  tipo: LancamentoTipo,
  _prev: LancamentoFormState,
  formData: FormData,
): Promise<LancamentoFormState> {
  let destino = "";
  try {
    const user = await assertPapel(EDITAR);

    const titulo = formData.get("titulo")?.toString().trim();
    const dataVencimento = data(formData.get("dataVencimento"));
    const dataCompetencia = data(formData.get("dataCompetencia"));
    const valor = num(formData.get("valor"));

    const fieldErrors: Record<string, string> = {};
    if (!titulo) fieldErrors.titulo = "Informe o título.";
    if (!dataVencimento) fieldErrors.dataVencimento = "Informe o vencimento.";
    if (!dataCompetencia) fieldErrors.dataCompetencia = "Informe a competência.";
    if (!(valor > 0)) fieldErrors.valor = "Informe um valor maior que zero.";

    if (tipo === "TRANSFERENCIA") {
      if (!formData.get("contaId")) fieldErrors.contaId = "Conta de origem obrigatória.";
      if (!formData.get("contaDestinoId")) fieldErrors.contaDestinoId = "Conta de destino obrigatória.";
      if (formData.get("contaId") && formData.get("contaId") === formData.get("contaDestinoId")) {
        fieldErrors.contaDestinoId = "Destino deve ser diferente da origem.";
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { error: "Confira os campos destacados.", fieldErrors };
    }

    const quitar = formData.get("quitarAgora") === "on";
    const base = {
      tipo,
      titulo: titulo!,
      dataVencimento: dataVencimento!,
      dataCompetencia: dataCompetencia!,
      dataFaturamento: data(formData.get("dataFaturamento")),
      valor,
      acrescimos: num(formData.get("acrescimos")),
      descontos: num(formData.get("descontos")),
      condicao: (formData.get("condicao")?.toString() === "PARCELADO" ? "PARCELADO" : "A_VISTA") as
        | "A_VISTA"
        | "PARCELADO",
      docNf: txt(formData.get("docNf")),
      observacao: txt(formData.get("observacao")),
      projetoId: txt(formData.get("projetoId")),
      jobId: txt(formData.get("jobId")),
      centroCustoId: txt(formData.get("centroCustoId")),
      contaId: txt(formData.get("contaId")),
      // Beneficiário: a quem o pagamento se destina (só faz sentido em despesa).
      colaboradorId: tipo === "DESPESA" ? txt(formData.get("colaboradorId")) : null,
      // Por tipo:
      clienteId: tipo === "RECEITA" ? txt(formData.get("sacadoId")) : null,
      fornecedorId: tipo === "DESPESA" ? txt(formData.get("sacadoId")) : null,
      categoriaId: tipo === "TRANSFERENCIA" ? null : txt(formData.get("categoriaId")),
      contaDestinoId: tipo === "TRANSFERENCIA" ? txt(formData.get("contaDestinoId")) : null,
      status: (quitar ? "QUITADO" : "EM_ABERTO") as "QUITADO" | "EM_ABERTO",
      dataPagamento: quitar ? (data(formData.get("dataPagamento")) ?? new Date()) : data(formData.get("dataPagamento")),
    };

    // Parcelamento: só na criação (não na edição).
    let parcelas: { valor: number; vencimento: string }[] = [];
    if (!id && base.condicao === "PARCELADO") {
      try { parcelas = JSON.parse(formData.get("parcelas")?.toString() || "[]"); } catch { parcelas = []; }
      parcelas = parcelas.filter((p) => p && p.valor > 0 && p.vencimento);
    }

    if (id) {
      await db.lancamento.update({ where: { id }, data: base });
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "editou o lançamento" });
    } else if (parcelas.length >= 2) {
      const grupo = randomUUID();
      const total = parcelas.length;
      for (let i = 0; i < total; i++) {
        const p = parcelas[i];
        const venc = new Date(`${p.vencimento}T00:00:00`);
        const comp = addMonths(dataCompetencia!, i);
        const numero = await proximoNumero("LANCAMENTO");
        await db.lancamento.create({
          data: {
            ...base,
            titulo: `${titulo} (${i + 1}/${total})`,
            valor: p.valor,
            dataVencimento: venc,
            dataCompetencia: comp,
            status: "EM_ABERTO",
            dataPagamento: null,
            parcelaGrupo: grupo,
            parcelaNum: i + 1,
            parcelaTotal: total,
            numero,
            criadoPorId: user.id,
          },
        });
      }
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: grupo, usuarioId: user.id, acao: `criou lançamento parcelado (${total}x)` });
    } else {
      const numero = await proximoNumero("LANCAMENTO");
      await db.lancamento.create({ data: { ...base, numero, criadoPorId: user.id } });
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: String(numero), usuarioId: user.id, acao: `criou lançamento #${numero}` });
    }
    destino = `/financeiro?ano=${dataCompetencia!.getFullYear()}&mes=${dataCompetencia!.getMonth() + 1}`;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o lançamento." };
  }
  revalidatePath("/financeiro");
  redirect(destino);
}

export async function quitarLancamento(id: string) {
  const user = await assertPapel(EDITAR);
  await db.lancamento.update({ where: { id }, data: { status: "QUITADO", dataPagamento: new Date() } });
  await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "quitou o lançamento" });
  revalidatePath("/financeiro");
}

export async function estornarLancamento(id: string) {
  const user = await assertPapel(EDITAR);
  await db.lancamento.update({ where: { id }, data: { status: "EM_ABERTO", dataPagamento: null } });
  await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "estornou a quitação" });
  revalidatePath("/financeiro");
}

export async function excluirLancamento(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  const l = await db.lancamento.findUnique({ where: { id }, select: { dataCompetencia: true } });
  await db.lancamento.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "excluiu o lançamento" });
  revalidatePath("/financeiro");
  const d = l?.dataCompetencia ?? new Date();
  redirect(`/financeiro?ano=${d.getFullYear()}&mes=${d.getMonth() + 1}`);
}
