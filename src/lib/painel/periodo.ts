/** Resolução do período do Painel Estratégico e do período anterior (mesma duração). */

export type PeriodoTipo = "mes" | "trimestre" | "ano" | "intervalo";

export type Janela = { inicio: Date; fim: Date }; // fim EXCLUSIVO (usar lt)

export type Periodo = {
  tipo: PeriodoTipo;
  inicio: Date;
  fim: Date; // exclusivo
  label: string;
  anterior: Janela;
  // valores crus para montar a querystring dos exports
  params: Record<string, string>;
};

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataISO(v: string | undefined): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function fmtDia(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR").format(d);
}

/**
 * Interpreta os searchParams e devolve a janela atual + a janela anterior de mesma duração.
 * `periodo` = mes | trimestre | ano | intervalo. Sem nada válido, cai no mês atual.
 */
export function resolverPeriodo(sp: {
  periodo?: string;
  ano?: string;
  mes?: string;
  tri?: string;
  de?: string;
  ate?: string;
}): Periodo {
  const agora = new Date();
  const tipo = (["mes", "trimestre", "ano", "intervalo"].includes(sp.periodo ?? "") ? sp.periodo : "mes") as PeriodoTipo;
  const ano = Number(sp.ano) || agora.getFullYear();

  if (tipo === "ano") {
    const inicio = new Date(ano, 0, 1);
    const fim = new Date(ano + 1, 0, 1);
    return {
      tipo, inicio, fim, label: `${ano}`,
      anterior: { inicio: new Date(ano - 1, 0, 1), fim: new Date(ano, 0, 1) },
      params: { periodo: "ano", ano: String(ano) },
    };
  }

  if (tipo === "trimestre") {
    const tri = Math.min(4, Math.max(1, Number(sp.tri) || Math.floor(agora.getMonth() / 3) + 1));
    const mesIni = (tri - 1) * 3;
    const inicio = new Date(ano, mesIni, 1);
    const fim = new Date(ano, mesIni + 3, 1);
    return {
      tipo, inicio, fim, label: `${tri}º trimestre de ${ano}`,
      anterior: { inicio: new Date(ano, mesIni - 3, 1), fim: new Date(ano, mesIni, 1) },
      params: { periodo: "trimestre", ano: String(ano), tri: String(tri) },
    };
  }

  if (tipo === "intervalo") {
    const de = dataISO(sp.de) ?? new Date(agora.getFullYear(), agora.getMonth(), 1);
    const ateBruto = dataISO(sp.ate) ?? agora;
    // fim exclusivo = dia seguinte ao "ate"
    const fim = new Date(ateBruto.getFullYear(), ateBruto.getMonth(), ateBruto.getDate() + 1);
    const inicio = new Date(de.getFullYear(), de.getMonth(), de.getDate());
    const dur = fim.getTime() - inicio.getTime();
    return {
      tipo, inicio, fim,
      label: `${fmtDia(inicio)} a ${fmtDia(new Date(fim.getTime() - 1))}`,
      anterior: { inicio: new Date(inicio.getTime() - dur), fim: new Date(inicio.getTime()) },
      params: { periodo: "intervalo", de: sp.de ?? "", ate: sp.ate ?? "" },
    };
  }

  // mês (padrão)
  const mes = Math.min(12, Math.max(1, Number(sp.mes) || agora.getMonth() + 1));
  const inicio = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);
  return {
    tipo: "mes", inicio, fim,
    label: `${MESES[mes - 1]} de ${ano}`,
    anterior: { inicio: new Date(ano, mes - 2, 1), fim: new Date(ano, mes - 1, 1) },
    params: { periodo: "mes", ano: String(ano), mes: String(mes) },
  };
}

/** Querystring a partir dos params do período (para links de export). */
export function periodoQuery(p: Periodo): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(p.params)) if (v) q.set(k, v);
  return q.toString();
}
