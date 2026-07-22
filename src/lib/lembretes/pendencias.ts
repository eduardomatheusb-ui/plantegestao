import "server-only";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

/**
 * Lembrete de uso do sistema — o popup diário.
 *
 * O agente das 8h conta à direção que o sistema não está sendo alimentado.
 * Quem precisa mudar de hábito, porém, é quem preenche — e essa pessoa nunca vê
 * aquele resumo. Este lembrete fecha o laço: mostra a CADA UM o que é dele.
 *
 * Princípios (é o que separa lembrete útil de papel de parede):
 * - No máximo 3 pendências. Lista longa não se lê, se fecha.
 * - Só aparece quando há algo. Dia limpo não incomoda ninguém.
 * - Toda pendência leva a um link que resolve.
 * - Junto da cobrança vai um placar: reforço positivo muda hábito, dedo na cara não.
 */

/** Quantas pendências no máximo aparecem de uma vez. */
const MAX_PENDENCIAS = 3;

export type Pendencia = {
  chave: string;
  titulo: string;
  detalhe: string;
  href: string;
  acao: string;
};

export type Novidade = { data: string; titulo: string; itens: string[] };

export type Placar = { rotulo: string; valor: string; bom: boolean } | null;

export type Lembrete = {
  mostrar: boolean;
  nome: string;
  pendencias: Pendencia[];
  totalPendencias: number;
  novidades: Novidade[];
  manualNuncaLido: boolean;
  placar: Placar;
};

const DIA_MS = 86_400_000;
const FMT_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Dia do calendário de Brasília (o servidor roda em UTC). */
function diaBR(d: Date): string {
  return FMT_DIA.format(d);
}

function semHtml(v: string | null | undefined): string {
  if (!v) return "";
  return v.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

/**
 * Novidades do sistema, lidas de docs/NOVIDADES.md.
 * Formato: "## AAAA-MM-DD — Título" e, abaixo, linhas começando com "- ".
 */
export function lerNovidades(): Novidade[] {
  let md = "";
  try {
    md = fs.readFileSync(path.join(process.cwd(), "docs", "NOVIDADES.md"), "utf8");
  } catch {
    return [];
  }
  const novidades: Novidade[] = [];
  let atual: Novidade | null = null;
  for (const linha of md.split("\n")) {
    const cab = linha.match(/^##\s+(\d{4}-\d{2}-\d{2})\s*[—-]\s*(.+)$/);
    if (cab) {
      atual = { data: cab[1], titulo: cab[2].trim(), itens: [] };
      novidades.push(atual);
      continue;
    }
    const item = linha.match(/^[-*]\s+(.+)$/);
    if (item && atual) atual.itens.push(item[1].trim());
  }
  return novidades;
}

/** Monta o lembrete do usuário. Devolve `mostrar: false` quando não há nada a dizer. */
export async function montarLembrete(usuarioId: string): Promise<Lembrete> {
  const usuario = await db.usuario.findUnique({
    where: { id: usuarioId },
    select: {
      nome: true,
      lembreteVistoEm: true,
      manualLidoEm: true,
      novidadesVistasEm: true,
    },
  });

  const vazio: Lembrete = {
    mostrar: false,
    nome: usuario?.nome ?? "",
    pendencias: [],
    totalPendencias: 0,
    novidades: [],
    manualNuncaLido: false,
    placar: null,
  };
  if (!usuario) return vazio;

  // Uma vez por dia: se já viu hoje (no calendário de Brasília), não repete.
  const agora = new Date();
  if (usuario.lembreteVistoEm && diaBR(usuario.lembreteVistoEm) === diaBR(agora)) return vazio;

  const jobs = await db.job.findMany({
    where: { arquivado: false, responsavelId: usuarioId, status: { isConcluido: false } },
    select: {
      id: true,
      numero: true,
      prazo: true,
      prazoPostagem: true,
      publicadoEm: true,
      briefing: true,
      atualizadoEm: true,
    },
  });

  const hojeStr = diaBR(agora);
  const semBriefing = jobs.filter((j) => semHtml(j.briefing).length < 80);
  const semPrazo = jobs.filter((j) => !j.prazo);
  const semMarcar = jobs.filter(
    (j) => j.prazoPostagem && !j.publicadoEm && diaBR(j.prazoPostagem) < hojeStr,
  );
  const parados = jobs.filter((j) => agora.getTime() - j.atualizadoEm.getTime() > 7 * DIA_MS);

  // Contas do cliente sob responsabilidade da pessoa (atendimento ou estratégia).
  const contas = await db.cliente.findMany({
    where: {
      arquivado: false,
      status: "ativo",
      OR: [{ atendimentoId: usuarioId }, { estrategiaId: usuarioId }],
    },
    select: { nome: true, nomeFantasia: true, tomDeVoz: true, dossie: { select: { clienteId: true } } },
  });
  const contasSemDossie = contas.filter((c) => !c.dossie);

  const candidatas: Pendencia[] = [];

  if (semMarcar.length > 0) {
    candidatas.push({
      chave: "marcar-publicado",
      titulo: `${semMarcar.length} ${semMarcar.length === 1 ? "postagem sua já passou da data" : "postagens suas já passaram da data"} e não ${semMarcar.length === 1 ? "está marcada" : "estão marcadas"} como publicada`,
      detalhe:
        "Sem essa marcação, o sistema não sabe se a peça foi ao ar — e os relatórios de prazo saem errados.",
      href: "/jobs",
      acao: "Marcar publicadas",
    });
  }

  if (semBriefing.length > 0) {
    candidatas.push({
      chave: "briefing",
      titulo: `${semBriefing.length} ${semBriefing.length === 1 ? "job seu está" : "jobs seus estão"} sem briefing`,
      detalhe: "Job sem briefing volta em retrabalho. Dois minutos agora economizam uma refação depois.",
      href: "/jobs",
      acao: "Completar briefing",
    });
  }

  if (semPrazo.length > 0) {
    candidatas.push({
      chave: "sem-prazo",
      titulo: `${semPrazo.length} ${semPrazo.length === 1 ? "job seu está" : "jobs seus estão"} sem prazo`,
      detalhe: "Job sem prazo fica invisível: não entra em alerta, não aparece em atraso, ninguém cobra.",
      href: "/jobs",
      acao: "Definir prazo",
    });
  }

  if (contasSemDossie.length > 0) {
    candidatas.push({
      chave: "dossie",
      titulo: `${contasSemDossie.length} ${contasSemDossie.length === 1 ? "cliente seu está" : "clientes seus estão"} sem dossiê`,
      detalhe:
        "O dossiê guarda tom de voz, restrições e o que saber antes de produzir. É o que evita erro na entrega.",
      href: "/cadastros/clientes",
      acao: "Preencher dossiê",
    });
  }

  if (parados.length > 0) {
    candidatas.push({
      chave: "parados",
      titulo: `${parados.length} ${parados.length === 1 ? "job seu está" : "jobs seus estão"} sem mexer há mais de 7 dias`,
      detalhe: "Se o trabalho andou e o sistema não sabe, para a agência inteira ele parou.",
      href: "/jobs",
      acao: "Atualizar",
    });
  }

  // Rodízio por dia: com a ordem fixa, quem tem mais de 3 pendências veria
  // sempre as mesmas e as últimas nunca apareceriam. Girando pelo número do
  // dia, todas passam pela frente da pessoa ao longo da semana.
  const [ay, am, ad] = hojeStr.split("-").map(Number);
  const numeroDoDia = Math.floor(Date.UTC(ay, am - 1, ad) / DIA_MS);
  const pendencias =
    candidatas.length <= MAX_PENDENCIAS
      ? candidatas
      : Array.from(
          { length: MAX_PENDENCIAS },
          (_, i) => candidatas[((numeroDoDia * MAX_PENDENCIAS) % candidatas.length + i) % candidatas.length],
        );

  // Novidades ainda não vistas por esta pessoa.
  const todas = lerNovidades();
  const corte = usuario.novidadesVistasEm ? diaBR(usuario.novidadesVistasEm) : null;
  const novidades = (corte ? todas.filter((n) => n.data > corte) : todas).slice(0, 2);

  const manualNuncaLido = !usuario.manualLidoEm;

  // Placar: proporção de postagens do mês que a pessoa marcou como publicadas.
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const postagensDoMes = await db.job.findMany({
    where: {
      arquivado: false,
      responsavelId: usuarioId,
      prazoPostagem: { gte: inicioMes, lte: agora },
    },
    select: { publicadoEm: true },
  });
  let placar: Placar = null;
  if (postagensDoMes.length >= 3) {
    const marcadas = postagensDoMes.filter((p) => p.publicadoEm).length;
    const pct = Math.round((marcadas / postagensDoMes.length) * 100);
    placar = {
      rotulo: "Postagens suas marcadas como publicadas neste mês",
      valor: `${marcadas} de ${postagensDoMes.length} (${pct}%)`,
      bom: pct >= 80,
    };
  }

  const mostrar = pendencias.length > 0 || novidades.length > 0 || manualNuncaLido;

  return {
    mostrar,
    nome: usuario.nome,
    pendencias,
    totalPendencias: candidatas.length,
    novidades,
    manualNuncaLido,
    placar,
  };
}
