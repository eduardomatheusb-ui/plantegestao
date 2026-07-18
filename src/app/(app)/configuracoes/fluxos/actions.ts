"use server";

import { revalidatePath } from "next/cache";
import { requireModulo } from "@/lib/permissoes.server";
import { registrarLog } from "@/lib/log";
import { getSessionUser } from "@/lib/rbac";
import { salvarEtapas, salvarArea, restaurarEtapasPadrao } from "@/lib/jobs/config";
import { rotuloTipoJob } from "@/lib/jobs/tipos";

export type FluxoFormState = { ok?: string; error?: string };

/** Salva as etapas padrão e a regra de área de um tipo de job. */
export async function salvarFluxo(tipo: string, _prev: FluxoFormState, formData: FormData): Promise<FluxoFormState> {
  try {
    await requireModulo("admin", "ADMIN");
    const user = await getSessionUser();

    // Etapas: uma por linha, na ordem em que aparecem.
    const etapas = (formData.get("etapas")?.toString() ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    // Área: funções marcadas + as digitadas à mão.
    const marcadas = formData.getAll("funcoes").map(String);
    const extras = (formData.get("funcoesExtras")?.toString() ?? "").split(",");
    const termos = [...new Set([...marcadas, ...extras].map((t) => t.trim()).filter(Boolean))];

    await salvarEtapas(tipo, etapas);
    await salvarArea(tipo, termos);

    await registrarLog({
      entidadeTipo: "config_fluxo",
      entidadeId: tipo,
      usuarioId: user?.id,
      acao: `alterou o fluxo do tipo "${rotuloTipoJob(tipo)}"`,
      para: `${etapas.length} etapa(s); área: ${termos.join(", ") || "nenhuma"}`,
    });

    revalidatePath("/configuracoes/fluxos");
    revalidatePath(`/configuracoes/fluxos/${tipo}`);
    return { ok: "Alterações salvas. Vale para os próximos jobs deste tipo." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível salvar." };
  }
}

/** Descarta a personalização das etapas e volta ao padrão de fábrica. */
export async function voltarAoPadrao(tipo: string): Promise<void> {
  await requireModulo("admin", "ADMIN");
  const user = await getSessionUser();
  await restaurarEtapasPadrao(tipo);
  await registrarLog({
    entidadeTipo: "config_fluxo",
    entidadeId: tipo,
    usuarioId: user?.id,
    acao: `restaurou as etapas padrão do tipo "${rotuloTipoJob(tipo)}"`,
  });
  revalidatePath("/configuracoes/fluxos");
  revalidatePath(`/configuracoes/fluxos/${tipo}`);
}
