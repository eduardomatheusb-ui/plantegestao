"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { CAMPOS_DOSSIE } from "@/lib/clientes/dossie";

/** Estação do Cliente: define o responsável pelo atendimento ou pela estratégia. */
export async function definirResponsavelConta(
  clienteId: string,
  papel: "atendimento" | "estrategia",
  usuarioId: string | null,
): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");

  const usuario = usuarioId
    ? await db.usuario.findUnique({ where: { id: usuarioId }, select: { id: true, nome: true } })
    : null;

  await db.cliente.update({
    where: { id: clienteId },
    data: papel === "atendimento" ? { atendimentoId: usuario?.id ?? null } : { estrategiaId: usuario?.id ?? null },
  });

  await registrarLog({
    entidadeTipo: "cliente",
    entidadeId: clienteId,
    usuarioId: acesso.id,
    acao: papel === "atendimento" ? "definiu o responsável pelo atendimento" : "definiu o responsável pela estratégia",
    para: usuario?.nome ?? "—",
  });

  revalidatePath(`/clientes/${clienteId}`);
}

/** Estação do Cliente: salva (upsert) o dossiê estratégico e volta para a aba. */
export async function salvarDossie(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");

  const data: Record<string, string | null> = {};
  for (const campo of CAMPOS_DOSSIE) {
    const v = formData.get(campo.name)?.toString().trim();
    data[campo.name] = v ? v : null;
  }

  await db.clienteDossie.upsert({
    where: { clienteId },
    create: { clienteId, ...data },
    update: data,
  });

  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "atualizou o dossiê estratégico" });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?aba=dossie`);
}

/** Estação: adiciona um item de escopo contratado (quadro contratado × utilizado). */
export async function salvarEscopoItem(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const rotulo = formData.get("rotulo")?.toString().trim();
  const bucket = formData.get("bucket")?.toString() ?? "outro";
  const qtd = parseInt(formData.get("quantidadeMensal")?.toString() ?? "", 10);
  const { BUCKETS_ESCOPO } = await import("@/lib/clientes/escopo");
  const def = BUCKETS_ESCOPO.find((b) => b.key === bucket);
  if (!rotulo || !def || !Number.isFinite(qtd) || qtd < 0) return;

  await db.escopoItem.create({
    data: { clienteId, rotulo, bucket, quantidadeMensal: qtd, unidade: def.unidade },
  });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "adicionou item de escopo", para: `${rotulo} (${qtd}/mês)` });
  revalidatePath(`/clientes/${clienteId}`);
}

/** Estação: remove um item de escopo contratado. */
export async function removerEscopoItem(id: string): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const item = await db.escopoItem.findUnique({ where: { id }, select: { clienteId: true, rotulo: true } });
  if (!item) return;
  await db.escopoItem.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: item.clienteId, usuarioId: acesso.id, acao: "removeu item de escopo", de: item.rotulo });
  revalidatePath(`/clientes/${item.clienteId}`);
}

/** Estação: registra ONDE está um acesso do cliente (nunca a senha). */
export async function salvarClienteAcesso(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const plataforma = formData.get("plataforma")?.toString().trim();
  if (!plataforma) return;
  await db.clienteAcesso.create({
    data: {
      clienteId,
      plataforma,
      identificacao: formData.get("identificacao")?.toString().trim() || null,
      ondeGuardado: formData.get("ondeGuardado")?.toString().trim() || null,
      quemTemAcesso: formData.get("quemTemAcesso")?.toString().trim() || null,
      observacao: formData.get("observacao")?.toString().trim() || null,
    },
  });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "registrou acesso", para: plataforma });
  revalidatePath(`/clientes/${clienteId}`);
}

/** Estação: remove o registro de um acesso. */
export async function removerClienteAcesso(id: string): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const item = await db.clienteAcesso.findUnique({ where: { id }, select: { clienteId: true, plataforma: true } });
  if (!item) return;
  await db.clienteAcesso.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "cliente", entidadeId: item.clienteId, usuarioId: acesso.id, acao: "removeu registro de acesso", de: item.plataforma });
  revalidatePath(`/clientes/${item.clienteId}`);
}

/** Estação: salva (upsert) o planejamento de um mês do cliente. */
export async function salvarPlanejamento(clienteId: string, formData: FormData): Promise<void> {
  const acesso = await assertModulo("cadastros", "EDITAR");
  const ano = parseInt(formData.get("ano")?.toString() ?? "", 10);
  const mes = parseInt(formData.get("mes")?.toString() ?? "", 10);
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || mes < 1 || mes > 12) return;

  const txt = (k: string) => formData.get(k)?.toString().trim() || null;
  const verbaBruta = formData.get("verbaMidia")?.toString().trim().replace(/\./g, "").replace(",", ".");
  const verbaNum = verbaBruta ? Number(verbaBruta) : NaN;

  const data = {
    objetivoPrincipal: txt("objetivoPrincipal"),
    pilares: txt("pilares"),
    produtosPrioritarios: txt("produtosPrioritarios"),
    datasImportantes: txt("datasImportantes"),
    acoesOnline: txt("acoesOnline"),
    acoesOffline: txt("acoesOffline"),
    producaoAudiovisual: txt("producaoAudiovisual"),
    indicadores: txt("indicadores"),
    verbaMidia: Number.isFinite(verbaNum) && verbaNum >= 0 ? verbaNum : null,
  };

  await db.planejamentoPeriodo.upsert({
    where: { clienteId_ano_mes: { clienteId, ano, mes } },
    create: { clienteId, ano, mes, ...data, criadoPorId: acesso.id },
    update: data,
  });

  await registrarLog({ entidadeTipo: "cliente", entidadeId: clienteId, usuarioId: acesso.id, acao: "atualizou o planejamento", para: `${String(mes).padStart(2, "0")}/${ano}` });
  revalidatePath(`/clientes/${clienteId}`);
  redirect(`/clientes/${clienteId}?aba=planejamento`);
}
