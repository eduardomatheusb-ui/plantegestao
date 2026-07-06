"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { getSessionUser } from "@/lib/rbac";
import { acessoAtual } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { notificar, notificarMuitos } from "@/lib/notificacoes";
import { obterReembolso, totalAprovado } from "./queries";
import { LIMITE_AUTORIZACAO, dataPrevistaPagamento, fimDaCompetencia, rotuloCompetencia } from "./constants";
import type { ReembolsoStatus } from "@prisma/client";

export type FormState = { error?: string; fieldErrors?: Record<string, string>; ok?: boolean };

const EDITAVEL: ReembolsoStatus[] = ["RASCUNHO", "PENDENTE_AJUSTE"];

async function userOrThrow() {
  const u = await getSessionUser();
  if (!u) throw new Error("Não autenticado.");
  return u;
}

/** Garante que quem chama é do financeiro (módulo financeiro ≥ EDITAR). */
async function assertFinanceiro() {
  const a = await acessoAtual();
  if (!podeModulo(a.caps, "financeiro", "EDITAR")) {
    throw new Error("Apenas o financeiro pode analisar reembolsos.");
  }
  return a;
}

function data(v: FormDataEntryValue | null): Date | null {
  const s = v?.toString();
  return s ? new Date(`${s}T00:00:00`) : null;
}
function num(v: FormDataEntryValue | null): number {
  const n = Number(v?.toString().replace(",", ".") || "0");
  return Number.isFinite(n) ? n : 0;
}
function txt(v: FormDataEntryValue | null): string | null {
  const s = v?.toString().trim();
  return s ? s : null;
}

function revalidar(id?: string) {
  revalidatePath("/reembolsos");
  if (id) revalidatePath(`/reembolsos/${id}`);
}

/** Remove os anexos (comprovantes) de despesas — registros + blobs. */
async function limparAnexosDespesas(despesaIds: string[]) {
  if (despesaIds.length === 0) return;
  const anexos = await db.anexo.findMany({
    where: { entidadeTipo: "reembolso_despesa", entidadeId: { in: despesaIds } },
    select: { id: true, blobKey: true, tipo: true },
  });
  const blobs = anexos.filter((a) => a.tipo === "arquivo" && a.blobKey).map((a) => a.blobKey!);
  if (blobs.length > 0) {
    try {
      const { getStore } = await import("@netlify/blobs");
      const store = getStore("anexos");
      await Promise.all(blobs.map((k) => store.delete(k)));
    } catch (e) {
      console.error("[reembolso] falha ao apagar blobs (ignorada):", e);
    }
  }
  await db.anexo.deleteMany({ where: { entidadeTipo: "reembolso_despesa", entidadeId: { in: despesaIds } } });
}

// ── Ciclo do pedido ─────────────────────────────────────────────────────

export async function criarReembolso(_prev: FormState, formData: FormData): Promise<FormState> {
  let destino = "";
  try {
    const user = await userOrThrow();
    const ano = Number(formData.get("competenciaAno")?.toString());
    const mes = Number(formData.get("competenciaMes")?.toString());
    if (!ano || !mes || mes < 1 || mes > 12) {
      return { error: "Informe o mês de competência." };
    }
    const numero = await proximoNumero("REEMBOLSO");
    const criado = await db.reembolso.create({
      data: {
        numero,
        solicitanteId: user.id,
        competenciaAno: ano,
        competenciaMes: mes,
        observacaoSolicitante: txt(formData.get("observacao")),
        dataPrevistaPagamento: dataPrevistaPagamento(ano, mes),
        status: "RASCUNHO",
      },
    });
    destino = `/reembolsos/${criado.id}`;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível criar o pedido." };
  }
  revalidar();
  redirect(destino);
}

export async function atualizarCabecalho(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await userOrThrow();
    const r = await db.reembolso.findUnique({ where: { id }, select: { solicitanteId: true, status: true } });
    if (!r) return { error: "Pedido não encontrado." };
    if (r.solicitanteId !== user.id) return { error: "Você só edita seus próprios pedidos." };
    if (!EDITAVEL.includes(r.status)) return { error: "Este pedido não pode mais ser editado." };
    const ano = Number(formData.get("competenciaAno")?.toString());
    const mes = Number(formData.get("competenciaMes")?.toString());
    if (!ano || !mes || mes < 1 || mes > 12) return { error: "Informe o mês de competência." };
    await db.reembolso.update({
      where: { id },
      data: {
        competenciaAno: ano,
        competenciaMes: mes,
        observacaoSolicitante: txt(formData.get("observacao")),
        dataPrevistaPagamento: dataPrevistaPagamento(ano, mes),
      },
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidar(id);
  return { ok: true };
}

// ── Despesas ─────────────────────────────────────────────────────────────

function lerDespesa(formData: FormData): { error?: string; fieldErrors?: Record<string, string>; dados?: Record<string, unknown> } {
  const fieldErrors: Record<string, string> = {};
  const dataDesp = data(formData.get("data"));
  const categoria = formData.get("categoria")?.toString().trim();
  const descricao = formData.get("descricao")?.toString().trim();
  const valor = num(formData.get("valor"));
  const autorizadoPor = txt(formData.get("autorizadoPor"));

  if (!dataDesp) fieldErrors.data = "Informe a data.";
  if (!categoria) fieldErrors.categoria = "Escolha a categoria.";
  if (!descricao) fieldErrors.descricao = "Descreva a despesa.";
  if (!(valor > 0)) fieldErrors.valor = "Valor maior que zero.";
  if (valor > LIMITE_AUTORIZACAO && !autorizadoPor) {
    fieldErrors.autorizadoPor = `Acima de R$ ${LIMITE_AUTORIZACAO} exige quem autorizou.`;
  }
  if (Object.keys(fieldErrors).length > 0) return { error: "Confira os campos destacados.", fieldErrors };

  return {
    dados: {
      data: dataDesp!,
      categoria,
      descricao,
      valor,
      formaPagamento: txt(formData.get("formaPagamento")),
      clienteId: txt(formData.get("clienteId")),
      projetoId: txt(formData.get("projetoId")),
      jobId: txt(formData.get("jobId")),
      centroCustoId: txt(formData.get("centroCustoId")),
      repassavelCliente: formData.get("repassavelCliente") === "on",
      autorizadoPor,
    },
  };
}

export async function adicionarDespesa(reembolsoId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await userOrThrow();
    const r = await db.reembolso.findUnique({ where: { id: reembolsoId }, select: { solicitanteId: true, status: true } });
    if (!r) return { error: "Pedido não encontrado." };
    if (r.solicitanteId !== user.id) return { error: "Você só edita seus próprios pedidos." };
    if (!EDITAVEL.includes(r.status)) return { error: "Este pedido não pode mais receber despesas." };

    const parsed = lerDespesa(formData);
    if (parsed.error) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

    await db.reembolsoDespesa.create({ data: { reembolsoId, ...(parsed.dados as object) } as never });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível adicionar a despesa." };
  }
  revalidar(reembolsoId);
  return { ok: true };
}

export async function editarDespesa(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const user = await userOrThrow();
    const d = await db.reembolsoDespesa.findUnique({ where: { id }, include: { reembolso: { select: { id: true, solicitanteId: true, status: true } } } });
    if (!d) return { error: "Despesa não encontrada." };
    if (d.reembolso.solicitanteId !== user.id) return { error: "Você só edita seus próprios pedidos." };
    if (!EDITAVEL.includes(d.reembolso.status)) return { error: "Este pedido não pode mais ser editado." };

    const parsed = lerDespesa(formData);
    if (parsed.error) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

    await db.reembolsoDespesa.update({ where: { id }, data: { ...(parsed.dados as object), aprovada: null, parecerItem: null } as never });
    revalidar(d.reembolso.id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar a despesa." };
  }
  return { ok: true };
}

export async function excluirDespesa(id: string): Promise<void> {
  const user = await userOrThrow();
  const d = await db.reembolsoDespesa.findUnique({ where: { id }, include: { reembolso: { select: { id: true, solicitanteId: true, status: true } } } });
  if (!d) return;
  if (d.reembolso.solicitanteId !== user.id) throw new Error("Você só edita seus próprios pedidos.");
  if (!EDITAVEL.includes(d.reembolso.status)) throw new Error("Este pedido não pode mais ser editado.");
  await limparAnexosDespesas([id]);
  await db.reembolsoDespesa.delete({ where: { id } });
  revalidar(d.reembolso.id);
}

// ── Transições de status ──────────────────────────────────────────────────

export async function enviarParaAnalise(id: string): Promise<void> {
  const user = await userOrThrow();
  const r = await db.reembolso.findUnique({ where: { id }, include: { despesas: { select: { id: true } } } });
  if (!r) throw new Error("Pedido não encontrado.");
  if (r.solicitanteId !== user.id) throw new Error("Você só envia seus próprios pedidos.");
  if (!EDITAVEL.includes(r.status)) throw new Error("Este pedido já foi enviado.");
  if (r.despesas.length === 0) throw new Error("Adicione ao menos uma despesa antes de enviar.");

  await db.reembolso.update({ where: { id }, data: { status: "ENVIADO" } });
  await registrarLog({ entidadeTipo: "reembolso", entidadeId: id, usuarioId: user.id, acao: "enviou o reembolso para análise" });

  const financeiro = await db.usuario.findMany({ where: { ativo: true, papel: { in: ["GESTOR", "SOCIO_DIRETOR"] } }, select: { id: true } });
  await notificarMuitos(financeiro.map((u) => u.id), {
    atorId: user.id,
    tipo: "reembolso",
    titulo: `Reembolso #${r.numero} aguardando análise`,
    descricao: `${user.name ?? "Um colaborador"} enviou um pedido de reembolso.`,
    entidadeTipo: "reembolso",
    entidadeId: id,
    url: `/reembolsos/${id}`,
  });
  revalidar(id);
}

export async function pedirAjuste(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const a = await assertFinanceiro();
    const parecer = txt(formData.get("parecer"));
    if (!parecer) return { error: "Explique o que precisa ser ajustado." };
    const r = await db.reembolso.findUnique({ where: { id }, select: { numero: true, solicitanteId: true, status: true } });
    if (!r) return { error: "Pedido não encontrado." };
    if (r.status !== "ENVIADO") return { error: "Só é possível pedir ajuste de um pedido enviado." };

    await db.reembolso.update({ where: { id }, data: { status: "PENDENTE_AJUSTE", parecerFinanceiro: parecer, analisadoPorId: a.id, analisadoEm: new Date() } });
    await notificar({
      usuarioId: r.solicitanteId, atorId: a.id, tipo: "reembolso",
      titulo: `Reembolso #${r.numero} precisa de ajuste`, descricao: parecer,
      entidadeTipo: "reembolso", entidadeId: id, url: `/reembolsos/${id}`,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidar(id);
  return { ok: true };
}

export async function aprovarReembolso(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const a = await assertFinanceiro();
    const r = await db.reembolso.findUnique({ where: { id }, include: { despesas: { select: { valor: true, aprovada: true } } } });
    if (!r) return { error: "Pedido não encontrado." };
    if (r.status !== "ENVIADO") return { error: "Só é possível aprovar um pedido enviado." };
    if (totalAprovado(r.despesas) <= 0) return { error: "Não há despesas aprovadas para reembolsar." };

    await db.reembolso.update({
      where: { id },
      data: {
        status: "APROVADO",
        parecerFinanceiro: txt(formData.get("parecer")),
        analisadoPorId: a.id,
        analisadoEm: new Date(),
        dataPrevistaPagamento: dataPrevistaPagamento(r.competenciaAno, r.competenciaMes),
      },
    });
    await notificar({
      usuarioId: r.solicitanteId, atorId: a.id, tipo: "reembolso",
      titulo: `Reembolso #${r.numero} aprovado`, descricao: "Seu reembolso foi aprovado e entrará para pagamento.",
      entidadeTipo: "reembolso", entidadeId: id, url: `/reembolsos/${id}`,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível aprovar." };
  }
  revalidar(id);
  return { ok: true };
}

export async function reprovarReembolso(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const a = await assertFinanceiro();
    const parecer = txt(formData.get("parecer"));
    if (!parecer) return { error: "Informe o motivo da reprovação." };
    const r = await db.reembolso.findUnique({ where: { id }, select: { numero: true, solicitanteId: true, status: true } });
    if (!r) return { error: "Pedido não encontrado." };
    if (!["ENVIADO", "PENDENTE_AJUSTE"].includes(r.status)) return { error: "Este pedido não pode ser reprovado agora." };

    await db.reembolso.update({ where: { id }, data: { status: "REPROVADO", parecerFinanceiro: parecer, analisadoPorId: a.id, analisadoEm: new Date() } });
    await notificar({
      usuarioId: r.solicitanteId, atorId: a.id, tipo: "reembolso",
      titulo: `Reembolso #${r.numero} reprovado`, descricao: parecer,
      entidadeTipo: "reembolso", entidadeId: id, url: `/reembolsos/${id}`,
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível reprovar." };
  }
  revalidar(id);
  return { ok: true };
}

/** Financeiro marca uma despesa individual como aprovada/reprovada durante a análise. */
export async function avaliarDespesa(id: string, aprovada: boolean, parecerItem?: string): Promise<void> {
  await assertFinanceiro();
  const d = await db.reembolsoDespesa.findUnique({ where: { id }, select: { reembolsoId: true, reembolso: { select: { status: true } } } });
  if (!d) return;
  if (d.reembolso.status !== "ENVIADO") throw new Error("Só é possível avaliar itens de um pedido em análise.");
  await db.reembolsoDespesa.update({ where: { id }, data: { aprovada, parecerItem: aprovada ? null : (parecerItem?.trim() || null) } });
  revalidar(d.reembolsoId);
}

/** Programa o pagamento: gera o lançamento de despesa no financeiro. */
export async function programarPagamento(id: string): Promise<void> {
  const a = await assertFinanceiro();
  const r = await obterReembolso(id);
  if (!r) throw new Error("Pedido não encontrado.");
  if (r.status !== "APROVADO") throw new Error("Só é possível programar um pedido aprovado.");
  if (r.lancamentoId) throw new Error("Este pedido já tem lançamento gerado.");

  const valor = totalAprovado(r.despesas);
  if (valor <= 0) throw new Error("Não há valor aprovado para pagar.");

  // Categoria "Reembolsos" (despesa) — cria se não existir.
  let categoria = await db.categoria.findFirst({ where: { tipo: "DESPESA", nome: "Reembolsos" }, select: { id: true } });
  if (!categoria) {
    categoria = await db.categoria.create({ data: { nome: "Reembolsos", tipo: "DESPESA" }, select: { id: true } });
  }

  // Beneficiário: colaborador vinculado ao solicitante, se houver.
  const colaborador = await db.colaborador.findUnique({ where: { usuarioId: r.solicitanteId }, select: { id: true } });

  const vencimento = r.dataPrevistaPagamento ?? dataPrevistaPagamento(r.competenciaAno, r.competenciaMes);
  const numero = await proximoNumero("LANCAMENTO");
  const lanc = await db.lancamento.create({
    data: {
      numero,
      tipo: "DESPESA",
      titulo: `Reembolso #${r.numero} — ${r.solicitante.nome}`,
      valor,
      dataVencimento: vencimento,
      dataCompetencia: fimDaCompetencia(r.competenciaAno, r.competenciaMes),
      categoriaId: categoria.id,
      colaboradorId: colaborador?.id ?? null,
      observacao: `Reembolso operacional — competência ${rotuloCompetencia(r.competenciaAno, r.competenciaMes)}.`,
      status: "EM_ABERTO",
      criadoPorId: a.id,
    },
    select: { id: true },
  });

  await db.reembolso.update({ where: { id }, data: { status: "PROGRAMADO", lancamentoId: lanc.id } });
  await registrarLog({ entidadeTipo: "reembolso", entidadeId: id, usuarioId: a.id, acao: `programou pagamento (lançamento #${numero})` });
  await notificar({
    usuarioId: r.solicitanteId, atorId: a.id, tipo: "reembolso",
    titulo: `Reembolso #${r.numero} programado`, descricao: "Seu reembolso entrou no lote de pagamento.",
    entidadeTipo: "reembolso", entidadeId: id, url: `/reembolsos/${id}`,
  });
  revalidatePath("/financeiro");
  revalidar(id);
}

export async function marcarPago(id: string): Promise<void> {
  const a = await assertFinanceiro();
  const r = await db.reembolso.findUnique({ where: { id }, select: { numero: true, solicitanteId: true, status: true, lancamentoId: true } });
  if (!r) throw new Error("Pedido não encontrado.");
  if (r.status !== "PROGRAMADO") throw new Error("Só é possível pagar um pedido programado.");

  const agora = new Date();
  if (r.lancamentoId) {
    await db.lancamento.update({ where: { id: r.lancamentoId }, data: { status: "QUITADO", dataPagamento: agora } });
  }
  await db.reembolso.update({ where: { id }, data: { status: "PAGO", dataPagamento: agora } });
  await registrarLog({ entidadeTipo: "reembolso", entidadeId: id, usuarioId: a.id, acao: "marcou o reembolso como pago" });
  await notificar({
    usuarioId: r.solicitanteId, atorId: a.id, tipo: "reembolso",
    titulo: `Reembolso #${r.numero} pago`, descricao: "Seu reembolso foi pago.",
    entidadeTipo: "reembolso", entidadeId: id, url: `/reembolsos/${id}`,
  });
  revalidatePath("/financeiro");
  revalidar(id);
}

export async function excluirReembolso(id: string): Promise<void> {
  const user = await userOrThrow();
  const r = await db.reembolso.findUnique({ where: { id }, include: { despesas: { select: { id: true } } } });
  if (!r) return;
  const a = await acessoAtual();
  const ehDono = r.solicitanteId === user.id;
  const ehSocio = a.papel === "SOCIO_DIRETOR";
  // Dono só exclui rascunho; sócio pode excluir qualquer um (limpeza).
  if (!ehSocio && !(ehDono && r.status === "RASCUNHO")) {
    throw new Error("Só é possível excluir rascunhos que você criou.");
  }
  await limparAnexosDespesas(r.despesas.map((d) => d.id));
  await db.reembolso.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "reembolso", entidadeId: id, usuarioId: user.id, acao: "excluiu o reembolso" });
  revalidar();
  redirect("/reembolsos");
}
