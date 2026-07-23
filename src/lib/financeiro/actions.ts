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
/** Beneficiário de uma despesa vem como "tipo:id" (fornecedor|prestador|colaborador). */
function parseBeneficiario(v: FormDataEntryValue | null): { tipo: string; id: string } | null {
  const s = v?.toString().trim();
  if (!s || !s.includes(":")) return null;
  const [tipo, id] = s.split(":", 2);
  return id ? { tipo, id } : null;
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
    const benef = tipo === "DESPESA" ? parseBeneficiario(formData.get("beneficiario")) : null;
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
      // Por tipo:
      clienteId: tipo === "RECEITA" ? txt(formData.get("sacadoId")) : null,
      // Despesa: beneficiário unificado (fornecedor | prestador | colaborador).
      fornecedorId: benef?.tipo === "fornecedor" ? benef.id : null,
      prestadorId: benef?.tipo === "prestador" ? benef.id : null,
      colaboradorId: benef?.tipo === "colaborador" ? benef.id : null,
      categoriaId: tipo === "TRANSFERENCIA" ? null : txt(formData.get("categoriaId")),
      contaDestinoId: tipo === "TRANSFERENCIA" ? txt(formData.get("contaDestinoId")) : null,
      status: (quitar ? "QUITADO" : "EM_ABERTO") as "QUITADO" | "EM_ABERTO",
      dataPagamento: quitar ? (data(formData.get("dataPagamento")) ?? new Date()) : data(formData.get("dataPagamento")),
    };

    // Parcelamento: lê as parcelas sempre que a condição for PARCELADO
    // (na criação OU ao converter um lançamento único em parcelado na edição).
    let parcelas: { valor: number; vencimento: string }[] = [];
    if (base.condicao === "PARCELADO") {
      try { parcelas = JSON.parse(formData.get("parcelas")?.toString() || "[]"); } catch { parcelas = []; }
      parcelas = parcelas.filter((p) => p && p.valor > 0 && p.vencimento);
    }

    // Um lançamento que já é parcela de uma série não deve ser reparcelado.
    const existente = id ? await db.lancamento.findUnique({ where: { id }, select: { parcelaGrupo: true } }) : null;
    const jaEhParcela = !!existente?.parcelaGrupo;

    // "Parcelado" exige gerar as parcelas — evita lançamento parcelado sem parcelas.
    if (base.condicao === "PARCELADO" && parcelas.length < 2 && !jaEhParcela) {
      return { error: "Escolha o número de parcelas e clique em “Gerar parcelas” antes de salvar." };
    }

    const vaiParcelar = parcelas.length >= 2 && !jaEhParcela;

    if (id && !vaiParcelar) {
      await db.lancamento.update({ where: { id }, data: base });
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "editou o lançamento" });
    } else if (vaiParcelar) {
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
      if (id) {
        // Conversão na edição: remove o lançamento único que virou a série.
        await db.lancamento.delete({ where: { id } });
        await registrarLog({ entidadeTipo: "lancamento", entidadeId: grupo, usuarioId: user.id, acao: `parcelou o lançamento (${total}x)` });
      } else {
        await registrarLog({ entidadeTipo: "lancamento", entidadeId: grupo, usuarioId: user.id, acao: `criou lançamento parcelado (${total}x)` });
      }
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

// ── Ações em lote ─────────────────────────────────────────────────────

export type ResultadoLoteFin = { ok: number; ignorados: number; falhas: number };

const LIMITE_LOTE = 300;

/**
 * Quita vários lançamentos com a data de hoje.
 *
 * Transferência não tem estado de quitação, e o que já está quitado não muda:
 * ambos entram em "ignorados", não em "falhas". Assim o aviso final distingue
 * "não fazia sentido" de "deu erro".
 */
export async function quitarLancamentosEmLote(ids: string[]): Promise<ResultadoLoteFin> {
  const user = await assertPapel(EDITAR);
  const alvos = ids.slice(0, LIMITE_LOTE);

  const elegiveis = await db.lancamento.findMany({
    where: { id: { in: alvos }, status: "EM_ABERTO", tipo: { not: "TRANSFERENCIA" } },
    select: { id: true },
  });
  const idsQuitar = elegiveis.map((l) => l.id);

  if (idsQuitar.length > 0) {
    await db.lancamento.updateMany({
      where: { id: { in: idsQuitar } },
      data: { status: "QUITADO", dataPagamento: new Date() },
    });
    for (const id of idsQuitar) {
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "quitou o lançamento (em lote)" });
    }
  }

  revalidatePath("/financeiro");
  return { ok: idsQuitar.length, ignorados: alvos.length - idsQuitar.length, falhas: 0 };
}

/**
 * Aplica a mesma categoria OU o mesmo centro de custo a vários lançamentos.
 * `campo` diz qual dos dois; `valorId` vazio limpa o campo.
 */
export async function reclassificarLancamentosEmLote(
  ids: string[],
  campo: "categoriaId" | "centroCustoId",
  valorId: string | null,
): Promise<ResultadoLoteFin> {
  const user = await assertPapel(EDITAR);
  const alvos = ids.slice(0, LIMITE_LOTE);

  // Confere que o destino existe (e não foi arquivado), para não gravar um id órfão.
  if (valorId) {
    const existe =
      campo === "categoriaId"
        ? await db.categoria.count({ where: { id: valorId } })
        : await db.centroCusto.count({ where: { id: valorId, ativo: true } });
    if (!existe) throw new Error("Categoria ou centro de custo inválido.");
  }

  await db.lancamento.updateMany({
    where: { id: { in: alvos } },
    data: { [campo]: valorId },
  });
  const rotulo = campo === "categoriaId" ? "categoria" : "centro de custo";
  for (const id of alvos) {
    await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: `alterou ${rotulo} (em lote)` });
  }

  revalidatePath("/financeiro");
  return { ok: alvos.length, ignorados: 0, falhas: 0 };
}

/** Exclui vários lançamentos. Só Sócio-diretor. */
export async function excluirLancamentosEmLote(ids: string[]): Promise<ResultadoLoteFin> {
  const user = await assertPapel("SOCIO_DIRETOR");
  const alvos = ids.slice(0, LIMITE_LOTE);
  let ok = 0;
  let falhas = 0;

  // Um a um: lançamento pode ter vínculo (proposta de origem) e falhar sozinho,
  // sem derrubar o lote.
  for (const id of alvos) {
    try {
      await db.lancamento.delete({ where: { id } });
      await registrarLog({ entidadeTipo: "lancamento", entidadeId: id, usuarioId: user.id, acao: "excluiu o lançamento (em lote)" });
      ok++;
    } catch {
      falhas++;
    }
  }

  revalidatePath("/financeiro");
  return { ok, ignorados: 0, falhas };
}
