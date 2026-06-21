"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEntidade, type EntityConfig } from "./registry";
import * as repo from "./repo";
import {
  assertPapel,
  CADASTRO_EDITAR_MINIMO,
  CADASTRO_EXCLUIR_MINIMO,
} from "@/lib/rbac";
import { registrarLog } from "@/lib/log";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function montarRaw(config: EntityConfig, formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const campo of config.campos) {
    if (campo.type === "checkbox") {
      obj[campo.name] = formData.get(campo.name) === "on";
    } else {
      obj[campo.name] = (formData.get(campo.name) ?? "").toString();
    }
  }
  return obj;
}

/**
 * Cria ou atualiza um registro de cadastro.
 * Assinatura compatível com useActionState após bind(null, slug, id).
 */
export async function salvarCadastro(
  slug: string,
  id: string | null,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const config = getEntidade(slug);
  if (!config) return { error: "Cadastro inválido." };

  try {
    const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
    const raw = montarRaw(config, formData);
    const parsed = config.schema.safeParse(raw);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0];
        if (typeof campo === "string" && !fieldErrors[campo]) {
          fieldErrors[campo] = issue.message;
        }
      }
      return { error: "Confira os campos destacados.", fieldErrors };
    }

    const data = parsed.data as Record<string, unknown>;

    // Categoria não pode ser pai de si mesma.
    if (config.model === "categoria" && id && data.paiId === id) {
      return { error: "Uma categoria não pode ser pai dela mesma.", fieldErrors: { paiId: "Inválido." } };
    }

    if (id) {
      await repo.atualizar(config, id, data);
      await registrarLog({
        entidadeTipo: config.model,
        entidadeId: id,
        usuarioId: user.id,
        acao: `editou ${config.rotulo.toLowerCase()}`,
      });
    } else {
      const criado = await repo.criar(config, data);
      await registrarLog({
        entidadeTipo: config.model,
        entidadeId: criado.id,
        usuarioId: user.id,
        acao: `criou ${config.rotulo.toLowerCase()}`,
      });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }

  revalidatePath(`/cadastros/${slug}`);
  redirect(`/cadastros/${slug}`);
}

export async function arquivarCadastro(slug: string, id: string, arquivar: boolean) {
  const config = getEntidade(slug);
  if (!config) throw new Error("Cadastro inválido.");
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);

  await repo.definirArquivado(config, id, arquivar);
  await registrarLog({
    entidadeTipo: config.model,
    entidadeId: id,
    usuarioId: user.id,
    acao: arquivar ? `arquivou ${config.rotulo.toLowerCase()}` : `reativou ${config.rotulo.toLowerCase()}`,
  });
  revalidatePath(`/cadastros/${slug}`);
}

export async function excluirCadastro(slug: string, id: string) {
  const config = getEntidade(slug);
  if (!config) throw new Error("Cadastro inválido.");
  const user = await assertPapel(CADASTRO_EXCLUIR_MINIMO);

  await repo.excluir(config, id);
  await registrarLog({
    entidadeTipo: config.model,
    entidadeId: id,
    usuarioId: user.id,
    acao: `excluiu ${config.rotulo.toLowerCase()}`,
  });
  revalidatePath(`/cadastros/${slug}`);
}
