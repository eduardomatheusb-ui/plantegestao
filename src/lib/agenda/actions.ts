"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser, podePapel } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";
import { notificarMuitos } from "@/lib/notificacoes";
import { EMPRESA_PADRAO } from "@/lib/empresa";
import { rotuloTipo, TIPO_COMPROMISSO_PADRAO, TIPOS_COMPROMISSO, RECORRENCIAS_VALIDAS } from "./constants";

const P = EMPRESA_PADRAO;
// Dados mínimos para criar o singleton da Empresa (preserva o timbre padrão).
function singletonBase(token: string) {
  return {
    id: "singleton", marca: P.marca, razaoSocial: P.razaoSocial, cnpj: P.cnpj,
    email: P.email, emailFinanceiro: P.emailFinanceiro, telefone: P.telefone,
    cep: P.cep, endereco: P.endereco, agendaIcsToken: token,
  };
}

export type CompromissoFormState = { error?: string; fieldErrors?: Record<string, string> };

const GERIR: "GESTOR" = "GESTOR";
const TIPOS = new Set(TIPOS_COMPROMISSO.map((t) => t.key));

async function userOrThrow() {
  const u = await getSessionUser();
  if (!u) throw new Error("Não autenticado.");
  return u;
}
function txt(v: FormDataEntryValue | null): string | null {
  const s = v?.toString().trim();
  return s ? s : null;
}

function montarDatas(fd: FormData): { inicio: Date; fim: Date | null; diaInteiro: boolean } | null {
  const data = fd.get("data")?.toString();
  if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return null;
  const diaInteiro = fd.get("diaInteiro") === "on";
  if (diaInteiro) return { inicio: new Date(`${data}T00:00:00`), fim: null, diaInteiro: true };
  const hi = fd.get("horaInicio")?.toString() || "09:00";
  const hf = fd.get("horaFim")?.toString() || "";
  const inicio = new Date(`${data}T${hi}:00`);
  let fim: Date | null = hf ? new Date(`${data}T${hf}:00`) : null;
  if (fim && fim <= inicio) fim = null;
  return { inicio, fim, diaInteiro: false };
}

export async function salvarCompromisso(id: string | null, _prev: CompromissoFormState, formData: FormData): Promise<CompromissoFormState> {
  let destino = "";
  try {
    const user = await userOrThrow();
    const titulo = formData.get("titulo")?.toString().trim();
    const datas = montarDatas(formData);
    const fieldErrors: Record<string, string> = {};
    if (!titulo) fieldErrors.titulo = "Informe o título.";
    if (!datas) fieldErrors.data = "Informe a data.";
    if (Object.keys(fieldErrors).length) return { error: "Confira os campos.", fieldErrors };

    const tipo = formData.get("tipo")?.toString() ?? TIPO_COMPROMISSO_PADRAO;
    const participantes = [...new Set(formData.getAll("participantes").map(String).filter(Boolean))];

    // Recorrência: a cada N dias (7/15/30) até uma data opcional.
    const recNum = parseInt(formData.get("recorrenciaDias")?.toString() ?? "", 10);
    const recorrenciaDias = RECORRENCIAS_VALIDAS.has(recNum) ? recNum : null;
    const recAte = recorrenciaDias ? formData.get("recorrenciaAte")?.toString() : "";
    const recorrenciaAte = recAte && /^\d{4}-\d{2}-\d{2}$/.test(recAte) ? new Date(`${recAte}T23:59:59`) : null;

    const dados = {
      titulo: titulo!,
      tipo: TIPOS.has(tipo) ? tipo : TIPO_COMPROMISSO_PADRAO,
      inicio: datas!.inicio,
      fim: datas!.fim,
      diaInteiro: datas!.diaInteiro,
      local: txt(formData.get("local")),
      descricao: txt(formData.get("descricao")),
      clienteId: txt(formData.get("clienteId")),
      recorrenciaDias,
      recorrenciaAte,
    };

    let compromissoId: string;
    let antigos: string[] = [];
    if (id) {
      const atual = await db.compromisso.findUnique({ where: { id }, select: { criadoPorId: true } });
      if (!atual) return { error: "Compromisso não encontrado." };
      if (atual.criadoPorId !== user.id && !podePapel(user.papel, GERIR)) {
        return { error: "Você só edita compromissos que criou." };
      }
      antigos = (await db.compromissoParticipante.findMany({ where: { compromissoId: id }, select: { usuarioId: true } })).map((p) => p.usuarioId);
      await db.compromisso.update({ where: { id }, data: dados });
      await db.compromissoParticipante.deleteMany({ where: { compromissoId: id } });
      compromissoId = id;
      await registrarLog({ entidadeTipo: "compromisso", entidadeId: id, usuarioId: user.id, acao: "editou o compromisso" });
    } else {
      const criado = await db.compromisso.create({ data: { ...dados, criadoPorId: user.id } });
      compromissoId = criado.id;
      await registrarLog({ entidadeTipo: "compromisso", entidadeId: criado.id, usuarioId: user.id, acao: "criou um compromisso" });
    }

    if (participantes.length) {
      await db.compromissoParticipante.createMany({ data: participantes.map((usuarioId) => ({ compromissoId, usuarioId })), skipDuplicates: true });
      const novos = participantes.filter((u) => !antigos.includes(u) && u !== user.id);
      const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(dados.inicio);
      await notificarMuitos(novos, {
        atorId: user.id, tipo: "agenda",
        titulo: `${rotuloTipo(dados.tipo)}: ${dados.titulo}`,
        descricao: `${quando}${dados.local ? ` · ${dados.local}` : ""}`,
        entidadeTipo: "compromisso", entidadeId: compromissoId, url: "/agenda",
      });
    }
    destino = "/agenda";
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/agenda");
  redirect(destino);
}

export async function excluirCompromisso(id: string) {
  const user = await userOrThrow();
  const c = await db.compromisso.findUnique({ where: { id }, select: { criadoPorId: true } });
  if (!c) return;
  if (c.criadoPorId !== user.id && !podePapel(user.papel, GERIR)) {
    throw new Error("Você só exclui compromissos que criou.");
  }
  await db.compromisso.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "compromisso", entidadeId: id, usuarioId: user.id, acao: "excluiu o compromisso" });
  revalidatePath("/agenda");
  redirect("/agenda");
}

/** Garante que exista um token do feed .ics e o devolve. */
export async function garantirTokenAgenda(): Promise<string> {
  await userOrThrow();
  const empresa = await db.empresa.findUnique({ where: { id: "singleton" }, select: { agendaIcsToken: true } });
  if (empresa?.agendaIcsToken) return empresa.agendaIcsToken;
  const token = randomBytes(18).toString("hex");
  await db.empresa.upsert({
    where: { id: "singleton" },
    create: singletonBase(token),
    update: { agendaIcsToken: token },
  });
  return token;
}

/** Gera um novo token (invalida o link anterior). Só gestor/sócio. */
export async function regenerarTokenAgenda(): Promise<{ token: string }> {
  const user = await userOrThrow();
  if (!podePapel(user.papel, GERIR)) throw new Error("Apenas gestores podem regenerar o link.");
  const token = randomBytes(18).toString("hex");
  await db.empresa.upsert({
    where: { id: "singleton" },
    create: singletonBase(token),
    update: { agendaIcsToken: token },
  });
  revalidatePath("/agenda");
  return { token };
}
