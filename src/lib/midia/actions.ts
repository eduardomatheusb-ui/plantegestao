"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { proximoNumero } from "@/lib/sequence";
import { registrarLog } from "@/lib/log";
import { assertPapel } from "@/lib/rbac";
import { calcularTotaisMidia } from "./calculo";
import { STATUS_LABEL } from "./constants";
import type { MidiaStatus, VeiculoTipo } from "@prisma/client";

const EDITAR: "GESTOR" = "GESTOR";

export type MidiaFormState = { error?: string; fieldErrors?: Record<string, string> };

const TIPOS = ["RADIO", "TV", "EXTERIOR", "DIGITAL", "JORNAL", "REVISTA", "OUTRO"];
const STATUS = ["EM_ABERTO", "ENVIADA", "APROVADA", "REPROVADA", "CANCELADA"];

function n(v: FormDataEntryValue | null): number {
  const x = Number(v?.toString() || "0");
  return Number.isFinite(x) ? x : 0;
}
function t(v: FormDataEntryValue | null): string | null {
  const s = v?.toString().trim();
  return s ? s : null;
}

/** True para tipos com grade diária (rádio/TV); demais usam grade por período. */
function isGradeDiaria(tipo: VeiculoTipo): boolean {
  return tipo === "RADIO" || tipo === "TV";
}

/** Recalcula o valorTotal do plano (Total da Mídia + honorários). */
async function recalcular(planoId: string) {
  const plano = await db.midiaPlano.findUnique({
    where: { id: planoId },
    select: {
      tipo: true,
      honorarios: true,
      comissaoPct: true,
      grades: {
        select: {
          linhas: {
            select: { valorInsercao: true, desconto: true, quantidade: true, insercoes: { select: { quantidade: true } } },
          },
        },
      },
    },
  });
  if (!plano) return;
  const diario = isGradeDiaria(plano.tipo);
  const linhas = plano.grades.flatMap((g) => g.linhas).map((l) => ({
    totalInsercoes: diario ? l.insercoes.reduce((a, i) => a + i.quantidade, 0) : l.quantidade,
    valorInsercao: Number(l.valorInsercao),
    desconto: Number(l.desconto),
  }));
  const { valorTotal } = calcularTotaisMidia(linhas, Number(plano.comissaoPct), Number(plano.honorarios));
  await db.midiaPlano.update({ where: { id: planoId }, data: { valorTotal } });
}

// ── Plano ─────────────────────────────────────────────────────────────

export async function salvarMidiaPlano(
  id: string | null,
  _prev: MidiaFormState,
  formData: FormData,
): Promise<MidiaFormState> {
  let destino = "";
  try {
    const user = await assertPapel(EDITAR);
    const titulo = formData.get("titulo")?.toString().trim();
    const clienteId = formData.get("clienteId")?.toString();
    const tipo = formData.get("tipo")?.toString();

    const fieldErrors: Record<string, string> = {};
    if (!titulo) fieldErrors.titulo = "Informe o título.";
    if (!clienteId) fieldErrors.clienteId = "Selecione o cliente.";
    if (!tipo || !TIPOS.includes(tipo)) fieldErrors.tipo = "Selecione o tipo.";
    if (Object.keys(fieldErrors).length) return { error: "Confira os campos.", fieldErrors };

    const data = {
      tipo: tipo as VeiculoTipo,
      titulo: titulo!,
      clienteId: clienteId!,
      projetoId: t(formData.get("projetoId")),
      responsavelId: t(formData.get("responsavelId")),
      veiculoId: t(formData.get("veiculoId")),
      target: t(formData.get("target")),
      prazo: formData.get("prazo")?.toString() ? new Date(`${formData.get("prazo")}T00:00:00`) : null,
      contatoVeiculo: t(formData.get("contatoVeiculo")),
      rede: t(formData.get("rede")),
      tipoRede: t(formData.get("tipoRede")),
      numOrcamento: t(formData.get("numOrcamento")),
      comissaoPct: n(formData.get("comissaoPct")),
      honorarios: n(formData.get("honorarios")),
      bonificacao: n(formData.get("bonificacao")),
      instrucoesFaturamento: t(formData.get("instrucoesFaturamento")),
      versao: Math.max(1, Math.round(n(formData.get("versao")) || 1)),
      vencimento: formData.get("vencimento")?.toString() ? new Date(`${formData.get("vencimento")}T00:00:00`) : null,
      formaPagamento: t(formData.get("formaPagamento")),
    };

    if (id) {
      await db.midiaPlano.update({ where: { id }, data });
      await recalcular(id);
      await registrarLog({ entidadeTipo: "midia", entidadeId: id, usuarioId: user.id, acao: "editou o plano de mídia" });
      destino = `/midia/${id}`;
    } else {
      const numero = await proximoNumero("MIDIA");
      const criado = await db.midiaPlano.create({ data: { ...data, numero, responsavelId: data.responsavelId ?? user.id, criadoPorId: user.id } });
      await registrarLog({ entidadeTipo: "midia", entidadeId: criado.id, usuarioId: user.id, acao: `criou o plano de mídia #${numero}` });
      destino = `/midia/${criado.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar o plano." };
  }
  revalidatePath("/midia");
  redirect(destino);
}

export async function alterarStatusMidia(id: string, status: MidiaStatus) {
  const user = await assertPapel(EDITAR);
  if (!STATUS.includes(status)) throw new Error("Status inválido.");
  const atual = await db.midiaPlano.findUnique({ where: { id }, select: { status: true } });
  await db.midiaPlano.update({ where: { id }, data: { status } });
  await registrarLog({ entidadeTipo: "midia", entidadeId: id, usuarioId: user.id, acao: "mudou o status", de: atual ? STATUS_LABEL[atual.status] : null, para: STATUS_LABEL[status] });
  revalidatePath(`/midia/${id}`);
  revalidatePath("/midia");
}

export async function concluirMidia(id: string) {
  await alterarStatusMidia(id, "APROVADA");
}

export async function excluirMidia(id: string) {
  const user = await assertPapel("SOCIO_DIRETOR");
  await db.midiaPlano.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "midia", entidadeId: id, usuarioId: user.id, acao: "excluiu o plano de mídia" });
  revalidatePath("/midia");
  redirect("/midia");
}

// ── Peças ─────────────────────────────────────────────────────────────

export async function adicionarPeca(planoId: string, formData: FormData) {
  await assertPapel(EDITAR);
  const nome = formData.get("nome")?.toString().trim();
  if (!nome) return;
  let codigo = formData.get("codigo")?.toString().trim().toUpperCase();
  if (!codigo) {
    const count = await db.midiaPeca.count({ where: { planoId } });
    codigo = String.fromCharCode(65 + count); // A, B, C...
  }
  await db.midiaPeca.create({ data: { planoId, codigo, nome } });
  revalidatePath(`/midia/${planoId}`);
}

export async function removerPeca(id: string) {
  await assertPapel(EDITAR);
  const p = await db.midiaPeca.findUnique({ where: { id }, select: { planoId: true } });
  if (!p) return;
  await db.midiaPeca.delete({ where: { id } });
  await recalcular(p.planoId);
  revalidatePath(`/midia/${p.planoId}`);
}

// ── Grades ────────────────────────────────────────────────────────────

export async function adicionarGrade(planoId: string, formData: FormData) {
  await assertPapel(EDITAR);
  const ano = Number(formData.get("ano"));
  const mes = Number(formData.get("mes"));
  if (!ano || !mes) return;
  await db.midiaGrade.create({ data: { planoId, pracaNome: formData.get("pracaNome")?.toString().trim() || null, ano, mes } });
  revalidatePath(`/midia/${planoId}`);
}

export async function removerGrade(id: string) {
  await assertPapel(EDITAR);
  const g = await db.midiaGrade.findUnique({ where: { id }, select: { planoId: true } });
  if (!g) return;
  await db.midiaGrade.delete({ where: { id } });
  await recalcular(g.planoId);
  revalidatePath(`/midia/${g.planoId}`);
}

// ── Linhas da grade ───────────────────────────────────────────────────

export async function adicionarLinha(gradeId: string, formData: FormData) {
  await assertPapel(EDITAR);
  const grade = await db.midiaGrade.findUnique({ where: { id: gradeId }, select: { planoId: true } });
  if (!grade) return;
  const ultima = await db.midiaGradeLinha.findFirst({ where: { gradeId }, orderBy: { ordem: "desc" }, select: { ordem: true } });
  await db.midiaGradeLinha.create({
    data: {
      gradeId,
      pecaId: formData.get("pecaId")?.toString() || null,
      programaNome: formData.get("programaNome")?.toString().trim() || null,
      formato: formData.get("formato")?.toString().trim() || null,
      produto: t(formData.get("produto")),
      local: t(formData.get("local")),
      periodoInicio: formData.get("periodoInicio")?.toString() ? new Date(`${formData.get("periodoInicio")}T00:00:00`) : null,
      periodoFim: formData.get("periodoFim")?.toString() ? new Date(`${formData.get("periodoFim")}T00:00:00`) : null,
      quantidade: Math.max(0, Math.round(n(formData.get("quantidade")))),
      desconto: n(formData.get("desconto")),
      valorInsercao: n(formData.get("valorInsercao")),
      ordem: (ultima?.ordem ?? 0) + 1,
    },
  });
  await recalcular(grade.planoId);
  revalidatePath(`/midia/${grade.planoId}`);
}

/** Atualiza os campos de uma linha (usado no modo período / mídia externa). */
export async function atualizarLinha(id: string, _prev: { error?: string }, formData: FormData): Promise<{ error?: string }> {
  await assertPapel(EDITAR);
  const linha = await db.midiaGradeLinha.findUnique({ where: { id }, select: { grade: { select: { planoId: true } } } });
  if (!linha) return { error: "Linha não encontrada." };
  await db.midiaGradeLinha.update({
    where: { id },
    data: {
      produto: t(formData.get("produto")),
      local: t(formData.get("local")),
      periodoInicio: formData.get("periodoInicio")?.toString() ? new Date(`${formData.get("periodoInicio")}T00:00:00`) : null,
      periodoFim: formData.get("periodoFim")?.toString() ? new Date(`${formData.get("periodoFim")}T00:00:00`) : null,
      quantidade: Math.max(0, Math.round(n(formData.get("quantidade")))),
      desconto: n(formData.get("desconto")),
      valorInsercao: n(formData.get("valorInsercao")),
    },
  });
  await recalcular(linha.grade.planoId);
  revalidatePath(`/midia/${linha.grade.planoId}`);
  return {};
}

export async function removerLinha(id: string) {
  await assertPapel(EDITAR);
  const l = await db.midiaGradeLinha.findUnique({ where: { id }, select: { grade: { select: { planoId: true } } } });
  if (!l) return;
  await db.midiaGradeLinha.delete({ where: { id } });
  await recalcular(l.grade.planoId);
  revalidatePath(`/midia/${l.grade.planoId}`);
}

/** Define a quantidade de inserções de uma linha num dia (0 remove). */
export async function setInsercao(gradeLinhaId: string, dia: number, quantidade: number) {
  await assertPapel(EDITAR);
  const gl = await db.midiaGradeLinha.findUnique({ where: { id: gradeLinhaId }, select: { grade: { select: { planoId: true } } } });
  if (!gl) return;

  const q = Math.max(0, Math.round(quantidade || 0));
  if (q <= 0) {
    await db.midiaInsercao.deleteMany({ where: { gradeLinhaId, dia } });
  } else {
    await db.midiaInsercao.upsert({
      where: { gradeLinhaId_dia: { gradeLinhaId, dia } },
      create: { gradeLinhaId, dia, quantidade: q },
      update: { quantidade: q },
    });
  }
  await recalcular(gl.grade.planoId);
  revalidatePath(`/midia/${gl.grade.planoId}`);
}
