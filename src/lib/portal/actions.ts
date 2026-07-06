"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPapel, CADASTRO_EDITAR_MINIMO } from "@/lib/rbac";
import { registrarLog } from "@/lib/log";

function slugBase(s: string) {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "cliente";
}

/** Gera um slug único: base amigável + sufixo aleatório curto (inadivinhável). */
async function slugUnico(base: string): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const slug = `${slugBase(base)}-${randomBytes(2).toString("hex")}`;
    const existe = await db.cliente.findUnique({ where: { portalSlug: slug }, select: { id: true } });
    if (!existe) return slug;
  }
  return `${slugBase(base)}-${randomBytes(4).toString("hex")}`;
}

/** Ativa o portal: gera token (secreto) + slug amigável a partir do nome. */
export async function gerarPortal(clienteId: string): Promise<void> {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  const c = await db.cliente.findUnique({ where: { id: clienteId }, select: { portalToken: true, portalSlug: true, nome: true, nomeFantasia: true } });
  if (!c) throw new Error("Cliente não encontrado.");
  const data: { portalToken?: string; portalSlug?: string } = {};
  if (!c.portalToken) data.portalToken = randomBytes(24).toString("hex");
  if (!c.portalSlug) data.portalSlug = await slugUnico(c.nomeFantasia || c.nome);
  if (Object.keys(data).length) {
    await db.cliente.update({ where: { id: clienteId }, data });
    await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "ativou o portal do cliente" });
  }
  revalidatePath(`/cadastros/clientes/${clienteId}`);
}

/** Personaliza o slug do portal (mantém o sufixo aleatório por segurança). */
export async function personalizarSlugPortal(clienteId: string, base: string): Promise<{ error?: string }> {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  const limpo = slugBase(base);
  if (limpo === "cliente" || limpo.length < 2) return { error: "Informe um nome válido (ex.: dra-jessica)." };
  const slug = await slugUnico(base);
  await db.cliente.update({ where: { id: clienteId }, data: { portalSlug: slug } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "personalizou o link do portal", para: slug });
  revalidatePath(`/cadastros/clientes/${clienteId}`);
  return {};
}

/** Desativa o portal (invalida token e slug). */
export async function desativarPortal(clienteId: string): Promise<void> {
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  await db.cliente.update({ where: { id: clienteId }, data: { portalToken: null, portalSlug: null } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: user.id, acao: "desativou o portal do cliente" });
  revalidatePath(`/cadastros/clientes/${clienteId}`);
}
