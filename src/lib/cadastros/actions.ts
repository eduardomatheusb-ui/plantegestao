"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEntidade, moduloDaEntidade, type EntityConfig } from "./registry";
import * as repo from "./repo";
import {
  assertPapel,
  CADASTRO_EDITAR_MINIMO,
  CADASTRO_EXCLUIR_MINIMO,
} from "@/lib/rbac";
import { acessoAtual, assertModulo } from "@/lib/permissoes.server";
import { podeModulo } from "@/lib/permissoes";
import { registrarLog } from "@/lib/log";

export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

function montarRaw(config: EntityConfig, formData: FormData, admin: boolean, podeFinanceiro: boolean): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const campo of config.campos) {
    if (campo.adminOnly && !admin) continue; // campo sensível: ignora para não-admin
    if (campo.financeiroOnly && !podeFinanceiro) continue; // campo financeiro: ignora para quem não vê financeiro
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
    const acesso = await acessoAtual();
    const admin = acesso.admin;
    const podeFinanceiro = podeModulo(acesso.caps, "financeiro", "VER");
    const raw = montarRaw(config, formData, admin, podeFinanceiro);
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

    // Não-admin nunca grava campos sensíveis (deixa-os intactos no banco).
    if (!admin) {
      for (const campo of config.campos) {
        if (campo.adminOnly) delete data[campo.name];
      }
    }
    // Sem acesso ao financeiro: preserva os campos financeiros (não sobrescreve).
    if (!podeFinanceiro) {
      for (const campo of config.campos) {
        if (campo.financeiroOnly) delete data[campo.name];
      }
    }

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
      // Registra quem cadastrou o cliente (base do recorte de acesso do atendimento).
      if (config.model === "cliente") data.criadoPorId = user.id;
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
  // O módulo também é checado aqui, não só na tela: contas bancárias e centros
  // de custo respondem ao financeiro, e ação de servidor é chamável direto.
  await assertModulo(moduloDaEntidade(config), "EDITAR");

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
  await assertModulo(moduloDaEntidade(config), "EDITAR");

  await repo.excluir(config, id);
  await registrarLog({
    entidadeTipo: config.model,
    entidadeId: id,
    usuarioId: user.id,
    acao: `excluiu ${config.rotulo.toLowerCase()}`,
  });
  revalidatePath(`/cadastros/${slug}`);
}

// ── Ações em lote ─────────────────────────────────────────────────────

/** Quantos deram certo, quantos falharam e por quê (para mostrar na tela). */
export type ResultadoLote = {
  ok: number;
  falhas: { nome: string; motivo: string }[];
};

const LIMITE_LOTE = 200;

/** Nome legível de um registro, para a mensagem de erro fazer sentido. */
function rotuloRegistro(reg: Record<string, unknown> | null, config: EntityConfig): string {
  if (!reg) return config.rotulo.toLowerCase();
  for (const chave of ["nome", "nomeFantasia", "titulo", "rotulo"]) {
    const v = reg[chave];
    if (typeof v === "string" && v.trim()) return v;
  }
  return config.rotulo.toLowerCase();
}

/** Arquiva ou reativa vários registros de uma vez. */
export async function arquivarCadastrosEmLote(
  slug: string,
  ids: string[],
  arquivar: boolean,
): Promise<ResultadoLote> {
  const config = getEntidade(slug);
  if (!config) throw new Error("Cadastro inválido.");
  if (!config.softDelete) throw new Error("Este cadastro não permite arquivar.");
  const user = await assertPapel(CADASTRO_EDITAR_MINIMO);
  await assertModulo(moduloDaEntidade(config), "EDITAR");

  const alvos = ids.slice(0, LIMITE_LOTE);
  const falhas: ResultadoLote["falhas"] = [];
  let ok = 0;

  for (const id of alvos) {
    try {
      await repo.definirArquivado(config, id, arquivar);
      await registrarLog({
        entidadeTipo: config.model,
        entidadeId: id,
        usuarioId: user.id,
        acao: arquivar ? `arquivou ${config.rotulo.toLowerCase()} (em lote)` : `reativou ${config.rotulo.toLowerCase()} (em lote)`,
      });
      ok++;
    } catch {
      const reg = (await repo.obter(config, id).catch(() => null)) as Record<string, unknown> | null;
      falhas.push({ nome: rotuloRegistro(reg, config), motivo: "não foi possível alterar" });
    }
  }

  revalidatePath(`/cadastros/${slug}`);
  return { ok, falhas };
}

/**
 * Exclui vários registros de uma vez.
 *
 * Um a um de propósito: registro com vínculo (cliente com job, categoria em uso)
 * falha no banco, e a pessoa precisa saber QUAL não saiu, em vez de o lote
 * inteiro morrer no primeiro erro.
 */
export async function excluirCadastrosEmLote(slug: string, ids: string[]): Promise<ResultadoLote> {
  const config = getEntidade(slug);
  if (!config) throw new Error("Cadastro inválido.");
  const user = await assertPapel(CADASTRO_EXCLUIR_MINIMO);
  await assertModulo(moduloDaEntidade(config), "EDITAR");

  const alvos = ids.slice(0, LIMITE_LOTE);
  const falhas: ResultadoLote["falhas"] = [];
  let ok = 0;

  for (const id of alvos) {
    const reg = (await repo.obter(config, id).catch(() => null)) as Record<string, unknown> | null;
    const nome = rotuloRegistro(reg, config);
    try {
      await repo.excluir(config, id);
      await registrarLog({
        entidadeTipo: config.model,
        entidadeId: id,
        usuarioId: user.id,
        acao: `excluiu ${config.rotulo.toLowerCase()} (em lote)`,
      });
      ok++;
    } catch {
      falhas.push({ nome, motivo: "tem registros ligados a ele" });
    }
  }

  revalidatePath(`/cadastros/${slug}`);
  return { ok, falhas };
}
