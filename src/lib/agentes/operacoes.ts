import "server-only";
import { db } from "@/lib/db";
import { BUCKET_TIPOS, rotuloBucket } from "@/lib/clientes/escopo";
import { chaveDia, ehDiaUtil } from "@/lib/datas-uteis";

/**
 * Pacote de dados do Agente de Operações — Fase 0 (sem IA).
 *
 * Monta, direto do banco, exatamente o material que seria entregue ao Claude
 * para escrever o resumo diário da direção. Aqui ele é apenas exibido: se o
 * pacote estiver errado ou vazio, nenhum texto bem escrito conserta.
 *
 * Só leitura. Não altera nada e não chama IA.
 */

/** Janelas de alerta (decisão da direção: apertado). */
export const JANELAS = {
  /** Prazo interno vence em até N dias corridos. */
  vencendoEmDias: 2,
  /** Cliente não respondeu a aprovação enviada há N dias úteis. */
  aprovacaoParadaDiasUteis: 1,
  /** Job aberto sem nenhuma alteração há N dias úteis. */
  semAtualizacaoDiasUteis: 2,
  /** Contrato chega ao fim em até N dias. */
  contratoVencendoDias: 30,
  /** Cliente ativo sem job mexido há N dias. */
  clienteParadoDias: 30,
  /** Postagem remarcada N vezes ou mais. */
  remarcacoesAlerta: 2,
  /** Briefing com menos de N caracteres (texto limpo) conta como raso. */
  briefingCurtoChars: 80,
} as const;

/** Máximo de linhas por lista (o total real fica no resumo). */
const LIMITE_LISTA = 40;

const DIA_MS = 86_400_000;

export type JobLinha = {
  numero: number;
  titulo: string;
  cliente: string;
  responsavel: string | null;
  tipo: string;
  status: string;
  prioridade: string;
  prazo: string | null;
  prazoPostagem: string | null;
  /** Dias de atraso do prazo interno (negativo = ainda no prazo). */
  diasAtraso: number | null;
  /** Evidência: por que este job entrou nesta lista. */
  motivo: string;
};

export type PacoteOperacoes = {
  geradoEm: string;
  janelas: typeof JANELAS;
  resumo: {
    jobsAbertos: number;
    atrasados: number;
    vencendo: number;
    postagemAtrasada: number;
    postagemNaoMarcada: number;
    semResponsavel: number;
    bloqueados: number;
    aguardandoCliente: number;
    semAtualizacao: number;
    briefingFraco: number;
    remarcados: number;
    escopoEstourado: number;
    contratosVencendo: number;
    reajustesAtrasados: number;
    clientesParados: number;
  };
  /** Padrão do "sem atualização" — 92 linhas não se lê; a proporção sim. */
  semAtualizacaoResumo: { total: number; maisDe7Dias: number; maisDe14Dias: number };
  /** Cadastros sem nenhum job e sem contrato ativo — base antiga, não carteira. */
  cadastrosSemMovimento: number;
  atrasados: JobLinha[];
  vencendo: JobLinha[];
  /** Data de ir ao ar passou E alguém mexeu no job depois — atraso provável de verdade. */
  postagemAtrasada: JobLinha[];
  /** Data passou e ninguém tocou no job desde antes dela — provável falta de marcação. */
  postagemNaoMarcada: JobLinha[];
  semResponsavel: JobLinha[];
  bloqueados: JobLinha[];
  aguardandoCliente: JobLinha[];
  semAtualizacao: JobLinha[];
  briefingFraco: JobLinha[];
  remarcados: JobLinha[];
  escopoEstourado: {
    cliente: string;
    item: string;
    contratado: number;
    utilizado: number;
    excedente: number;
    unidade: string;
  }[];
  contratosVencendo: { cliente: string; servico: string | null; dataFim: string; diasRestantes: number }[];
  reajustesAtrasados: { cliente: string; reajusteEm: string; diasDesde: number; observacao: string | null }[];
  clientesParados: { cliente: string; diasSemMexer: number | null }[];
  cargaPorPessoa: {
    pessoa: string;
    abertos: number;
    atrasados: number;
    vencendo: number;
    semBriefing: number;
  }[];
  /** O que o sistema NÃO sabe — para não ser inventado depois. */
  lacunas: { titulo: string; detalhe: string; quantidade: number | null }[];
};

/** Remove tags de campos rich-text para medir o tamanho real do texto. */
function semHtml(v: string | null | undefined): string {
  if (!v) return "";
  return v
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Volta `n` dias úteis a partir de `d` (pula fim de semana e feriado). */
function subtrairDiasUteis(d: Date, n: number, feriados: Set<string>): Date {
  const x = new Date(d);
  let restantes = n;
  while (restantes > 0) {
    x.setDate(x.getDate() - 1);
    if (ehDiaUtil(x, feriados)) restantes--;
  }
  return x;
}

const FUSO = "America/Sao_Paulo";
const FMT_DIA = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSO,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Dia do calendário de Brasília, normalizado para meia-noite UTC.
 *
 * O servidor do Netlify roda em UTC (3h à frente). Sem isto, um job com prazo
 * em 20/07 às 23h de Brasília seria lido como 21/07 e sairia da lista de
 * atrasados — o resumo erraria o dia em todo prazo do fim da noite.
 */
function inicioDoDia(d: Date): Date {
  const [ano, mes, dia] = FMT_DIA.format(d).split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

/** Dias corridos entre duas datas (a - b), ignorando horário. */
function diasEntre(a: Date, b: Date): number {
  return Math.round((inicioDoDia(a).getTime() - inicioDoDia(b).getTime()) / DIA_MS);
}

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function nomeCliente(c: { nome: string; nomeFantasia: string | null } | null): string {
  if (!c) return "—";
  return c.nomeFantasia || c.nome;
}

/** Monta o pacote completo. Uma consulta grande de jobs + agregados. */
export async function montarPacoteOperacoes(): Promise<PacoteOperacoes> {
  const agora = new Date();
  const hoje = inicioDoDia(agora); // dia de Brasília, não do servidor
  const iniMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
  const proxMes = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1));

  const feriadosRows = await db.feriado.findMany({ select: { data: true } });
  const feriados = new Set(feriadosRows.map((f) => chaveDia(f.data)));

  const limiteAprovacao = subtrairDiasUteis(agora, JANELAS.aprovacaoParadaDiasUteis, feriados);
  const limiteAtualizacao = subtrairDiasUteis(agora, JANELAS.semAtualizacaoDiasUteis, feriados);
  const limiteContrato = new Date(agora.getTime() + JANELAS.contratoVencendoDias * DIA_MS);
  const limiteParado = new Date(agora.getTime() - JANELAS.clienteParadoDias * DIA_MS);

  // ── Jobs abertos: uma consulta só, classificada em memória.
  const jobs = await db.job.findMany({
    where: { arquivado: false, status: { isConcluido: false } },
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      prioridade: true,
      prazo: true,
      prazoPostagem: true,
      briefing: true,
      remarcacoesPostagem: true,
      publicadoEm: true,
      aprovacaoStatus: true,
      aprovacaoEm: true,
      atualizadoEm: true,
      bloqueadoPorId: true,
      responsavelId: true,
      cliente: { select: { nome: true, nomeFantasia: true } },
      responsavel: { select: { nome: true } },
      status: { select: { nome: true } },
    },
    orderBy: { prazo: "asc" },
  });

  const abertosIds = new Set(jobs.map((j) => j.id));

  const linha = (j: (typeof jobs)[number], motivo: string): JobLinha => ({
    numero: j.numero,
    titulo: j.titulo,
    cliente: nomeCliente(j.cliente),
    responsavel: j.responsavel?.nome ?? null,
    tipo: j.tipo,
    status: j.status.nome,
    prioridade: j.prioridade,
    prazo: iso(j.prazo),
    prazoPostagem: iso(j.prazoPostagem),
    diasAtraso: j.prazo ? diasEntre(hoje, j.prazo) : null,
    motivo,
  });

  const atrasados: JobLinha[] = [];
  const vencendo: JobLinha[] = [];
  const postagemAtrasada: JobLinha[] = [];
  const postagemNaoMarcada: JobLinha[] = [];
  const semResponsavel: JobLinha[] = [];
  const bloqueados: JobLinha[] = [];
  const aguardandoCliente: JobLinha[] = [];
  const semAtualizacao: JobLinha[] = [];
  const briefingFraco: JobLinha[] = [];
  const remarcados: JobLinha[] = [];
  /** Dias sem toque de cada job parado — para reportar o padrão, não 92 linhas. */
  const diasSemToque: number[] = [];

  // Carga por pessoa (contagem — o TREM não registra horas estimadas).
  const carga = new Map<string, { abertos: number; atrasados: number; vencendo: number; semBriefing: number }>();
  const somaCarga = (nome: string, campo: "abertos" | "atrasados" | "vencendo" | "semBriefing") => {
    const atual = carga.get(nome) ?? { abertos: 0, atrasados: 0, vencendo: 0, semBriefing: 0 };
    atual[campo]++;
    carga.set(nome, atual);
  };

  let semPrazoNenhum = 0;
  let semDataDoCliente = 0;

  for (const j of jobs) {
    const pessoa = j.responsavel?.nome ?? "Sem responsável";
    somaCarga(pessoa, "abertos");

    // Prazo interno vencido / vencendo.
    if (j.prazo) {
      const dias = diasEntre(hoje, j.prazo);
      if (dias > 0) {
        atrasados.push(linha(j, `Prazo interno venceu há ${dias} dia(s).`));
        somaCarga(pessoa, "atrasados");
      } else if (dias >= -JANELAS.vencendoEmDias) {
        vencendo.push(
          linha(j, dias === 0 ? "Prazo interno vence hoje." : `Prazo interno vence em ${-dias} dia(s).`),
        );
        somaCarga(pessoa, "vencendo");
      }
    } else {
      semPrazoNenhum++;
    }

    // Data de postagem (é a data que o cliente enxerga).
    //
    // Cuidado: `publicadoEm` depende de alguém marcar a peça como publicada, e na
    // prática isso não vem sendo feito. Então "passou da data e não consta publicado"
    // NÃO prova que a peça não foi ao ar. Separamos os dois casos pelo único sinal
    // disponível: se ninguém encostou no job depois que a data passou, é quase certo
    // que faltou marcar; se alguém mexeu depois, o atraso tende a ser real.
    if (j.prazoPostagem && !j.publicadoEm) {
      const dias = diasEntre(hoje, j.prazoPostagem);
      if (dias > 0) {
        const tocadoDepois = j.atualizadoEm > j.prazoPostagem;
        const alvo = tocadoDepois ? postagemAtrasada : postagemNaoMarcada;
        alvo.push(
          linha(
            j,
            tocadoDepois
              ? `Data de ir ao ar passou há ${dias} dia(s); o job foi mexido depois, então o atraso tende a ser real.`
              : `Data de ir ao ar passou há ${dias} dia(s) e ninguém tocou no job desde antes disso — provável falta de marcação, não atraso.`,
          ),
        );
      } else if (dias >= -JANELAS.vencendoEmDias) {
        postagemAtrasada.push(
          linha(j, dias === 0 ? "Vai ao ar hoje e ainda não foi publicado." : `Vai ao ar em ${-dias} dia(s).`),
        );
      }
    } else if (!j.prazoPostagem) {
      // Decisão da direção: `prazo` é interno. Logo, sem prazoPostagem não há
      // data prometida ao cliente registrada em lugar nenhum.
      semDataDoCliente++;
    }

    if (!j.responsavelId) semResponsavel.push(linha(j, "Job aberto sem responsável definido."));

    if (j.bloqueadoPorId && abertosIds.has(j.bloqueadoPorId)) {
      bloqueados.push(linha(j, "Depende de outro job que ainda não foi concluído."));
    }

    if (j.aprovacaoStatus === "enviado" && j.aprovacaoEm && j.aprovacaoEm <= limiteAprovacao) {
      const dias = diasEntre(hoje, j.aprovacaoEm);
      aguardandoCliente.push(linha(j, `Enviado para aprovação há ${dias} dia(s) e o cliente não respondeu.`));
    }

    if (j.atualizadoEm <= limiteAtualizacao) {
      const dias = diasEntre(hoje, j.atualizadoEm);
      semAtualizacao.push(linha(j, `Sem nenhuma alteração há ${dias} dia(s).`));
      diasSemToque.push(dias);
    }

    const briefingLimpo = semHtml(j.briefing);
    if (briefingLimpo.length < JANELAS.briefingCurtoChars) {
      briefingFraco.push(
        linha(
          j,
          briefingLimpo.length === 0
            ? "Briefing vazio."
            : `Briefing com apenas ${briefingLimpo.length} caracteres.`,
        ),
      );
      somaCarga(pessoa, "semBriefing");
    }

    if (j.remarcacoesPostagem >= JANELAS.remarcacoesAlerta) {
      remarcados.push(linha(j, `Data de postagem já foi remarcada ${j.remarcacoesPostagem} vezes.`));
    }
  }

  // ── Escopo contratado × utilizado no mês (mesma régua da Estação do Cliente).
  const [itensEscopo, gruposTipo, campanhasAtivas, reunioesMes, minutosMes] = await Promise.all([
    db.escopoItem.findMany({
      orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
      select: {
        rotulo: true,
        bucket: true,
        unidade: true,
        quantidadeMensal: true,
        cliente: { select: { nome: true, nomeFantasia: true } },
        clienteId: true,
      },
    }),
    db.job.groupBy({
      by: ["clienteId", "tipo"],
      where: { arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
      _count: { _all: true },
    }),
    db.campanha.groupBy({ by: ["clienteId"], where: { status: "ativa" }, _count: { _all: true } }),
    db.reuniao.groupBy({ by: ["clienteId"], where: { data: { gte: iniMes, lt: proxMes } }, _count: { _all: true } }),
    db.job.groupBy({
      by: ["clienteId"],
      where: { arquivado: false, concluidoEm: { gte: iniMes, lt: proxMes } },
      _sum: { minutosGravados: true },
    }),
  ]);

  const contaTipo = (clienteId: string, chaves: string[]) =>
    gruposTipo
      .filter((g) => g.clienteId === clienteId && chaves.includes(g.tipo))
      .reduce((s, g) => s + g._count._all, 0);

  const escopoEstourado: PacoteOperacoes["escopoEstourado"] = [];
  for (const item of itensEscopo) {
    let utilizado: number | null = null;
    if (item.bucket === "posts") utilizado = contaTipo(item.clienteId, BUCKET_TIPOS.posts);
    else if (item.bucket === "videos") utilizado = contaTipo(item.clienteId, BUCKET_TIPOS.videos);
    else if (item.bucket === "materiais") utilizado = contaTipo(item.clienteId, BUCKET_TIPOS.materiais);
    else if (item.bucket === "campanhas")
      utilizado = campanhasAtivas.find((c) => c.clienteId === item.clienteId)?._count._all ?? 0;
    else if (item.bucket === "reunioes")
      utilizado = reunioesMes.find((r) => r.clienteId === item.clienteId)?._count._all ?? 0;
    else if (item.bucket === "horas_captacao") {
      const min = minutosMes.find((m) => m.clienteId === item.clienteId)?._sum.minutosGravados ?? 0;
      utilizado = Math.round((min / 60) * 10) / 10;
    }
    // bucket "outro" é conta manual — sem número automático, fica de fora.
    if (utilizado == null) continue;
    if (utilizado > item.quantidadeMensal) {
      escopoEstourado.push({
        cliente: nomeCliente(item.cliente),
        item: item.rotulo || rotuloBucket(item.bucket),
        contratado: item.quantidadeMensal,
        utilizado,
        excedente: Math.round((utilizado - item.quantidadeMensal) * 10) / 10,
        unidade: item.unidade,
      });
    }
  }

  // ── Contratos: fim próximo e reajuste que passou da data.
  const [contratosFim, contratosReajuste, clientes] = await Promise.all([
    db.contrato.findMany({
      where: { status: "ativo", dataFim: { not: null, gte: agora, lte: limiteContrato } },
      orderBy: { dataFim: "asc" },
      select: { servico: true, dataFim: true, cliente: { select: { nome: true, nomeFantasia: true } } },
    }),
    db.contrato.findMany({
      where: { status: "ativo", reajusteEm: { not: null, lt: hoje } },
      orderBy: { reajusteEm: "asc" },
      select: { reajusteEm: true, reajusteObs: true, cliente: { select: { nome: true, nomeFantasia: true } } },
    }),
    db.cliente.findMany({
      where: { arquivado: false, status: "ativo" },
      select: {
        nome: true,
        nomeFantasia: true,
        tomDeVoz: true,
        dossie: { select: { clienteId: true } },
        contratos: { where: { status: "ativo" }, select: { id: true }, take: 1 },
        jobs: {
          where: { arquivado: false },
          orderBy: { atualizadoEm: "desc" },
          take: 1,
          select: { atualizadoEm: true },
        },
      },
    }),
  ]);

  // "Cliente parado" só faz sentido para quem é carteira: já teve job ou tem
  // contrato ativo. Cadastro antigo marcado como ativo não é alerta, é cadastro —
  // sem esse filtro o alerta viraria uma lista de 80 nomes que ninguém lê.
  const ehCarteira = (c: (typeof clientes)[number]) => c.jobs.length > 0 || c.contratos.length > 0;
  const cadastrosSemMovimento = clientes.filter((c) => !ehCarteira(c)).length;

  const clientesParados = clientes
    .filter(ehCarteira)
    .filter((c) => {
      const ultimo = c.jobs[0]?.atualizadoEm ?? null;
      return !ultimo || ultimo < limiteParado;
    })
    .map((c) => ({
      cliente: nomeCliente(c),
      diasSemMexer: c.jobs[0] ? diasEntre(hoje, c.jobs[0].atualizadoEm) : null,
    }))
    .sort((a, b) => (b.diasSemMexer ?? 9999) - (a.diasSemMexer ?? 9999));

  const semDossie = clientes.filter((c) => !c.dossie).length;
  const semTomDeVoz = clientes.filter((c) => !c.tomDeVoz || !c.tomDeVoz.trim()).length;

  // ── Lacunas: o que o sistema não sabe. Existe para não ser inventado depois.
  const lacunas: PacoteOperacoes["lacunas"] = [
    {
      titulo: "Peça publicada não é marcada como publicada",
      detalhe:
        "Confirmado pela direção: o campo `publicadoEm` não vem sendo preenchido. Logo, 'passou da data e não " +
        "consta publicado' NÃO prova que a peça deixou de ir ao ar. Por isso essas peças aparecem separadas em " +
        "'provável falta de marcação' e 'atraso provável'. Nenhum resumo pode afirmar que houve atraso de entrega " +
        "com base só neste campo.",
      quantidade: postagemNaoMarcada.length,
    },
    {
      titulo: "Cadastros de cliente sem nenhum movimento",
      detalhe:
        "Clientes com status 'ativo' que nunca tiveram job nem têm contrato ativo. São base antiga, não carteira — " +
        "ficaram fora do alerta de cliente parado para não virar ruído.",
      quantidade: cadastrosSemMovimento,
    },
    {
      titulo: "Data prometida ao cliente não registrada",
      detalhe:
        "O campo `prazo` é o prazo interno da equipe. Fora de postagem, o TREM não guarda a data que o cliente ouviu — " +
        "logo, não dá para medir risco com o cliente nesses jobs sem inventar.",
      quantidade: semDataDoCliente,
    },
    {
      titulo: "Jobs abertos sem prazo nenhum",
      detalhe: "Sem prazo não entram em nenhum cálculo de atraso — ficam invisíveis para o agente.",
      quantidade: semPrazoNenhum,
    },
    {
      titulo: "Não existe estimativa de esforço nem capacidade",
      detalhe:
        "O TREM registra horas apontadas depois do fato (Apontamento), mas não estimativa por job nem capacidade " +
        "semanal por pessoa. Por isso a carga abaixo é CONTAGEM de jobs, não horas. Qualquer número em horas seria invenção.",
      quantidade: null,
    },
    {
      titulo: "Não existe registro de férias ou ausência",
      detalhe:
        "O agente não tem como saber que alguém está fora quando calcula risco de prazo. Só há feriados cadastrados.",
      quantidade: null,
    },
    {
      titulo: "Clientes ativos sem dossiê preenchido",
      detalhe: "O dossiê alimenta planejamento, revisão e conteúdo. Sem ele, esses agentes ficam genéricos.",
      quantidade: semDossie,
    },
    {
      titulo: "Clientes ativos sem tom de voz",
      detalhe: "Sem tom de voz cadastrado, o revisor de qualidade não tem contra o que comparar.",
      quantidade: semTomDeVoz,
    },
  ];

  const corta = (l: JobLinha[]) => l.slice(0, LIMITE_LISTA);

  return {
    geradoEm: agora.toISOString(),
    janelas: JANELAS,
    resumo: {
      jobsAbertos: jobs.length,
      atrasados: atrasados.length,
      vencendo: vencendo.length,
      postagemAtrasada: postagemAtrasada.length,
      postagemNaoMarcada: postagemNaoMarcada.length,
      semResponsavel: semResponsavel.length,
      bloqueados: bloqueados.length,
      aguardandoCliente: aguardandoCliente.length,
      semAtualizacao: semAtualizacao.length,
      briefingFraco: briefingFraco.length,
      remarcados: remarcados.length,
      escopoEstourado: escopoEstourado.length,
      contratosVencendo: contratosFim.length,
      reajustesAtrasados: contratosReajuste.length,
      clientesParados: clientesParados.length,
    },
    semAtualizacaoResumo: {
      total: semAtualizacao.length,
      maisDe7Dias: diasSemToque.filter((d) => d > 7).length,
      maisDe14Dias: diasSemToque.filter((d) => d > 14).length,
    },
    cadastrosSemMovimento,
    atrasados: corta(atrasados),
    vencendo: corta(vencendo),
    postagemAtrasada: corta(postagemAtrasada),
    postagemNaoMarcada: corta(postagemNaoMarcada),
    semResponsavel: corta(semResponsavel),
    bloqueados: corta(bloqueados),
    aguardandoCliente: corta(aguardandoCliente),
    semAtualizacao: corta(semAtualizacao),
    briefingFraco: corta(briefingFraco),
    remarcados: corta(remarcados),
    escopoEstourado,
    contratosVencendo: contratosFim.map((c) => ({
      cliente: nomeCliente(c.cliente),
      servico: c.servico,
      dataFim: c.dataFim!.toISOString(),
      diasRestantes: diasEntre(c.dataFim!, hoje),
    })),
    reajustesAtrasados: contratosReajuste.map((c) => ({
      cliente: nomeCliente(c.cliente),
      reajusteEm: c.reajusteEm!.toISOString(),
      diasDesde: diasEntre(hoje, c.reajusteEm!),
      observacao: c.reajusteObs,
    })),
    clientesParados,
    cargaPorPessoa: [...carga.entries()]
      .map(([pessoa, v]) => ({ pessoa, ...v }))
      .sort((a, b) => b.abertos - a.abertos),
    lacunas,
  };
}
