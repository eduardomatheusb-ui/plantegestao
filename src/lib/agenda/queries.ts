import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { RECORRENCIAS_VALIDAS } from "./constants";

const detalheInclude = {
  cliente: { select: { id: true, nome: true, nomeFantasia: true } },
  criadoPor: { select: { id: true, nome: true } },
  participantes: { select: { usuario: { select: { id: true, nome: true } } } },
  reuniao: { select: { id: true } },
} satisfies Prisma.CompromissoInclude;

export type CompromissoDetalhe = Prisma.CompromissoGetPayload<{ include: typeof detalheInclude }>;
/** Uma ocorrência concreta (datas já resolvidas). `ocorrenciaKey` é única por evento+data. */
export type CompromissoOcorrencia = CompromissoDetalhe & { ocorrenciaKey: string };

// ── expansão de recorrência ───────────────────────────────────────────────
function addDias(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Datas de início das ocorrências de um evento recorrente dentro de [janIni, janFim). */
function ocorrencias(c: CompromissoDetalhe, janIni: Date, janFim: Date): Date[] {
  const passo = c.recorrenciaDias ?? 0;
  if (!passo || !RECORRENCIAS_VALIDAS.has(passo)) return [];
  const ate = c.recorrenciaAte ? new Date(c.recorrenciaAte) : null;
  const res: Date[] = [];
  let d = new Date(c.inicio);
  while (d < janIni) {
    if (ate && d > ate) return res;
    d = addDias(d, passo);
  }
  while (d < janFim) {
    if (ate && d > ate) break;
    res.push(new Date(d));
    d = addDias(d, passo);
  }
  return res;
}

function comDatas(c: CompromissoDetalhe, inicio: Date): CompromissoOcorrencia {
  const dur = c.fim ? new Date(c.fim).getTime() - new Date(c.inicio).getTime() : null;
  const fim = dur != null ? new Date(inicio.getTime() + dur) : null;
  return { ...c, inicio, fim, ocorrenciaKey: `${c.id}:${chaveDia(inicio)}` };
}

/** Compromissos (ocorrências já expandidas) que aparecem num mês. */
export async function listarCompromissosMes(ano: number, mes: number): Promise<CompromissoOcorrencia[]> {
  const ini = new Date(ano, mes - 1, 1);
  const fim = new Date(ano, mes, 1);
  const candidatos = await db.compromisso.findMany({
    where: {
      OR: [
        // não recorrentes que cruzam o mês
        { recorrenciaDias: null, OR: [{ inicio: { gte: ini, lt: fim } }, { AND: [{ inicio: { lt: ini } }, { fim: { gte: ini } }] }] },
        // recorrentes cujo início é anterior ao fim do mês e cuja recorrência não terminou antes do mês
        { recorrenciaDias: { not: null }, inicio: { lt: fim }, OR: [{ recorrenciaAte: null }, { recorrenciaAte: { gte: ini } }] },
      ],
    },
    orderBy: [{ inicio: "asc" }],
    include: detalheInclude,
  });

  const out: CompromissoOcorrencia[] = [];
  for (const c of candidatos) {
    const datas = c.recorrenciaDias ? ocorrencias(c, ini, fim) : [new Date(c.inicio)];
    for (const s of datas) out.push(comDatas(c, s));
  }
  out.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  return out;
}

export async function obterCompromisso(id: string): Promise<CompromissoDetalhe | null> {
  return db.compromisso.findUnique({ where: { id }, include: detalheInclude });
}

/** Próximos compromissos — a próxima ocorrência de cada evento (para o dashboard / lista rápida). */
export async function proximosCompromissos(limite = 6): Promise<CompromissoOcorrencia[]> {
  const agora = new Date();
  const fimJanela = addDias(agora, 180);
  const candidatos = await db.compromisso.findMany({
    where: {
      OR: [
        { recorrenciaDias: null, OR: [{ inicio: { gte: agora } }, { fim: { gte: agora } }] },
        { recorrenciaDias: { not: null }, inicio: { lt: fimJanela }, OR: [{ recorrenciaAte: null }, { recorrenciaAte: { gte: agora } }] },
      ],
    },
    include: detalheInclude,
  });

  const itens: CompromissoOcorrencia[] = [];
  for (const c of candidatos) {
    if (c.recorrenciaDias) {
      const datas = ocorrencias(c, agora, fimJanela);
      if (datas.length) itens.push(comDatas(c, datas[0]));
    } else {
      itens.push(comDatas(c, new Date(c.inicio)));
    }
  }
  itens.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
  return itens.slice(0, limite);
}

/** Compromissos para o feed .ics — evento base (a recorrência vira RRULE no .ics). */
export async function compromissosParaFeed() {
  const agora = new Date();
  const ini = new Date(agora.getTime() - 60 * 24 * 3600 * 1000);
  const fim = new Date(agora.getTime() + 400 * 24 * 3600 * 1000);
  return db.compromisso.findMany({
    where: {
      OR: [
        { recorrenciaDias: null, inicio: { gte: ini, lt: fim } },
        { recorrenciaDias: { not: null }, OR: [{ recorrenciaAte: null }, { recorrenciaAte: { gte: ini } }] },
      ],
    },
    orderBy: [{ inicio: "asc" }],
    include: {
      cliente: { select: { nome: true, nomeFantasia: true } },
    },
  });
}

/** Reuniões da agenda que ainda não têm ata vinculada (para a tela de Atas). */
export async function reunioesSemAta(limite = 12) {
  const limiteInicio = new Date(new Date().getTime() - 90 * 24 * 3600 * 1000); // até 90 dias atrás
  return db.compromisso.findMany({
    where: { tipo: "reuniao", reuniao: null, inicio: { gte: limiteInicio } },
    orderBy: [{ inicio: "desc" }],
    take: limite,
    include: { cliente: { select: { nome: true, nomeFantasia: true } } },
  });
}

/** Opções para o formulário (clientes + usuários ativos). */
export async function opcoesCompromisso() {
  const [clientes, usuarios] = await Promise.all([
    db.cliente.findMany({ where: { arquivado: false }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
    db.usuario.findMany({ where: { ativo: true }, orderBy: { nome: "asc" }, select: { id: true, nome: true } }),
  ]);
  return { clientes, usuarios };
}
