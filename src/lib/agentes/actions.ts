"use server";

import { requireUser } from "@/lib/rbac";
import { chamarAgenteGrafica, type AgenteGraficaResultado, type DadosGrafica } from "./http";

export type { AgenteGraficaResultado, DadosGrafica };

export async function gerarComparacaoGraficaAction(formData: DadosGrafica): Promise<AgenteGraficaResultado> {
  await requireUser();
  return chamarAgenteGrafica(formData);
}
