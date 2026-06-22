"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";

export type ReuniaoFormState = { error?: string };

const schema = z.object({
  titulo: z.string().trim().min(1, "Informe o título."),
  data: z.string().min(1, "Informe a data.").transform((v) => new Date(`${v}T12:00:00`)),
  clienteId: z.string().optional().transform((v) => (v ? v : null)),
  participantes: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  pauta: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  decisoes: z.string().optional().transform((v) => (v?.trim() ? v : null)),
  proximosPassos: z.string().optional().transform((v) => (v?.trim() ? v : null)),
});

export async function salvarReuniao(id: string | null, _prev: ReuniaoFormState, formData: FormData): Promise<ReuniaoFormState> {
  let destino = "";
  try {
    const acesso = await assertModulo("projetos", "EDITAR");
    const parsed = schema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Confira os campos." };
    const d = parsed.data;
    if (id) {
      await db.reuniao.update({ where: { id }, data: d });
      await registrarLog({ entidadeTipo: "reuniao", entidadeId: id, usuarioId: acesso.id, acao: "editou a ata" });
      destino = `/reunioes/${id}`;
    } else {
      const criado = await db.reuniao.create({ data: { ...d, criadoPorId: acesso.id } });
      await registrarLog({ entidadeTipo: "reuniao", entidadeId: criado.id, usuarioId: acesso.id, acao: "registrou a ata" });
      destino = `/reunioes/${criado.id}`;
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
  revalidatePath("/reunioes");
  redirect(destino);
}

export async function excluirReuniao(id: string) {
  const acesso = await assertModulo("projetos", "ADMIN");
  await db.reuniao.delete({ where: { id } });
  await registrarLog({ entidadeTipo: "reuniao", entidadeId: id, usuarioId: acesso.id, acao: "excluiu a ata" });
  revalidatePath("/reunioes");
  redirect("/reunioes");
}
