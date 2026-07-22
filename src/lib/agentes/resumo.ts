import "server-only";
import { db } from "@/lib/db";
import { iaConfigurada, gerarTextoIA } from "@/lib/ia";
import { montarPacoteOperacoes, type PacoteOperacoes } from "@/lib/agentes/operacoes";

/**
 * Resumo de operações: o agente propriamente dito.
 *
 * Lê o pacote de dados, escreve o resumo e entrega por notificação + e-mail.
 * Roda sozinho (função agendada) para a direção não precisar consultar tela.
 *
 * Regra de ouro: SUGERE, não age. Não muda status, não fala com cliente, não
 * altera nada, só descreve e recomenda.
 *
 * Sem ANTHROPIC_API_KEY o agente continua funcionando: cai no resumo
 * determinístico (mais seco, mesmos números). A IA melhora o texto, não é
 * condição para o resumo existir.
 */

const SYSTEM = `Você é o assistente de operações de uma agência de publicidade brasileira (Plante Comunicação).
Escreve para a DIREÇÃO, em português do Brasil, todo dia útil de manhã.

O QUE FAZER
Transformar os dados recebidos num resumo curto e acionável. Comece pelo que exige decisão hoje.

REGRAS INEGOCIÁVEIS
1. Use SOMENTE os dados fornecidos. Nunca invente cliente, job, número ou causa.
2. OS NÚMEROS JÁ VÊM CALCULADOS. O bloco "contagens" é a verdade: copie os valores como estão.
   Nunca recalcule, nunca some, nunca arredonde, nunca reagrupe. Se "contagens.atrasados" diz 12,
   escreva 12, mesmo que você tenha recebido só 8 exemplos na lista.
   Cada job também já vem na categoria certa: se está na lista "atrasados", ele ESTÁ atrasado;
   não o descreva como "vence hoje" nem o mova para outro grupo. O sistema classifica, você explica.
3. Separe claramente o que é FATO (está no dado) do que é INTERPRETAÇÃO sua.
4. NUNCA afirme que uma peça deixou de ir ao ar. O sistema não registra publicação de forma
   confiável, e a lista "postagemNaoMarcada" é falta de marcação, não atraso de entrega. Trate
   como higiene de registro, jamais como falha com o cliente.
5. Quando um problema atingir grande parte do total, descreva como PADRÃO, não como lista.
   Ex.: "92 de 101 jobs sem toque" é um sintoma do sistema não ser alimentado, não 92 pendências.
6. O bloco "lacunas" diz o que o sistema NÃO sabe. Respeite: não conclua nada que dependa de
   dado ausente, e mencione a lacuna quando ela limitar a leitura.
7. Não use tom acusatório. Avalie registros e processo, nunca a pessoa.
8. Não exagere risco nem esconda problema.
9. NUNCA use travessão (— ou –) nem ponto de exclamação. É exigência de quem lê.
   Use vírgula, dois-pontos, parênteses ou ponto final. Frase curta resolve.

FORMATO
- Um parágrafo curto de abertura com a situação geral.
- "Precisa de decisão hoje": no máximo 5 itens, cada um com cliente/job, o problema e a ação sugerida.
- "Padrões da semana": o que os números mostram sobre o funcionamento, não sobre tarefas.
- "O que não dá para afirmar": as lacunas que limitam este resumo.
Sem saudação, sem despedida, sem emoji. Texto puro, no máximo 350 palavras.`;

/** Recorte enxuto do pacote: o prompt não precisa das 40 linhas de cada lista. */
function compactar(p: PacoteOperacoes) {
  const enxuto = (l: PacoteOperacoes["atrasados"], n = 8) =>
    l.slice(0, n).map((j) => ({
      job: `#${j.numero} ${j.titulo}`,
      cliente: j.cliente,
      responsavel: j.responsavel,
      motivo: j.motivo,
    }));

  return {
    geradoEm: p.geradoEm,
    janelas: p.janelas,
    contagens: p.resumo,
    padraoSemAtualizacao: p.semAtualizacaoResumo,
    cadastrosSemMovimento: p.cadastrosSemMovimento,
    atrasados: enxuto(p.atrasados),
    postagemAtrasada: enxuto(p.postagemAtrasada),
    postagemNaoMarcada_APENAS_HIGIENE: enxuto(p.postagemNaoMarcada, 4),
    vencendo: enxuto(p.vencendo),
    aguardandoCliente: enxuto(p.aguardandoCliente),
    briefingFraco: enxuto(p.briefingFraco, 5),
    escopoEstourado: p.escopoEstourado,
    contratosVencendo: p.contratosVencendo,
    reajustesAtrasados: p.reajustesAtrasados,
    clientesParados: p.clientesParados.slice(0, 8),
    cargaPorPessoa: p.cargaPorPessoa,
    lacunas: p.lacunas,
  };
}

function plural(n: number, um: string, muitos: string): string {
  return `${n} ${n === 1 ? um : muitos}`;
}

/** Resumo sem IA: mesmos números, texto seco. É o piso de qualidade do agente. */
export function resumoSemIA(p: PacoteOperacoes): string {
  const r = p.resumo;
  const linhas: string[] = [];

  linhas.push(
    `${plural(r.jobsAbertos, "job aberto", "jobs abertos")} na agência. ` +
      `${plural(r.atrasados, "está com prazo interno vencido", "estão com prazo interno vencido")}` +
      (r.vencendo > 0 ? ` e ${plural(r.vencendo, "vence", "vencem")} nos próximos dias.` : "."),
  );

  const decisoes: string[] = [];
  for (const j of p.atrasados.slice(0, 5)) {
    decisoes.push(`#${j.numero} ${j.titulo} (${j.cliente}, ${j.responsavel ?? "sem responsável"}): ${j.motivo}`);
  }
  for (const c of p.contratosVencendo.slice(0, 2)) {
    decisoes.push(`Contrato do cliente ${c.cliente} termina em ${c.diasRestantes} dia(s).`);
  }
  for (const c of p.reajustesAtrasados.slice(0, 2)) {
    decisoes.push(`Reajuste do contrato de ${c.cliente} passou da data há ${c.diasDesde} dia(s).`);
  }
  for (const j of p.aguardandoCliente.slice(0, 2)) {
    decisoes.push(`#${j.numero} ${j.titulo} (${j.cliente}): ${j.motivo}`);
  }
  for (const e of p.escopoEstourado.slice(0, 3)) {
    decisoes.push(`${e.cliente} passou do escopo de ${e.item}: ${e.utilizado} de ${e.contratado} contratado(s).`);
  }

  if (decisoes.length) {
    linhas.push("", "PRECISA DE DECISÃO HOJE", ...decisoes.map((d) => `- ${d}`));
  } else {
    linhas.push("", "Nada exigindo decisão imediata hoje.");
  }

  const padroes: string[] = [];
  const s = p.semAtualizacaoResumo;
  if (s.total > 0) {
    const prop = Math.round((s.total / Math.max(1, r.jobsAbertos)) * 100);
    padroes.push(
      `${s.total} de ${r.jobsAbertos} jobs abertos (${prop}%) estão sem nenhuma alteração, ` +
        `${s.maisDe7Dias} há mais de 7 dias e ${s.maisDe14Dias} há mais de 14. ` +
        `Nessa proporção, o sinal é que o sistema não está acompanhando o trabalho.`,
    );
  }
  if (r.postagemNaoMarcada > 0) {
    padroes.push(
      `${r.postagemNaoMarcada} peça(s) passaram da data de ir ao ar sem ninguém tocar no job. ` +
        `Isso é falta de marcar como publicado. Não há como afirmar que deixaram de ir ao ar.`,
    );
  }
  if (r.briefingFraco > 0) {
    padroes.push(`${r.briefingFraco} job(s) abertos estão com briefing vazio ou muito curto.`);
  }
  const top = p.cargaPorPessoa[0];
  if (top && r.jobsAbertos > 0 && top.abertos / r.jobsAbertos > 0.4) {
    padroes.push(
      `${top.pessoa} concentra ${top.abertos} dos ${r.jobsAbertos} jobs abertos, carga bem desequilibrada.`,
    );
  }
  if (padroes.length) linhas.push("", "PADRÕES", ...padroes.map((d) => `- ${d}`));

  const lacunas = p.lacunas.filter((l) => l.quantidade == null || l.quantidade > 0);
  if (lacunas.length) {
    linhas.push(
      "",
      "O QUE NÃO DÁ PARA AFIRMAR",
      ...lacunas.map((l) => `- ${l.titulo}${l.quantidade != null ? ` (${l.quantidade})` : ""}`),
    );
  }

  return linhas.join("\n");
}

/** Uma linha para o corpo da notificação (o texto completo vai no e-mail). */
export function linhaResumo(p: PacoteOperacoes): string {
  const r = p.resumo;
  const partes = [
    `${r.atrasados} atrasado(s)`,
    r.contratosVencendo > 0 ? `${r.contratosVencendo} contrato(s) vencendo` : null,
    r.aguardandoCliente > 0 ? `${r.aguardandoCliente} aguardando cliente` : null,
    r.postagemNaoMarcada > 0 ? `${r.postagemNaoMarcada} sem marcar publicado` : null,
  ].filter(Boolean);
  return partes.join(" · ");
}

export type ResumoOperacional = {
  texto: string;
  comIA: boolean;
  titulo: string;
  descricao: string;
  pacote: PacoteOperacoes;
};

/** Monta o pacote e escreve o resumo (com IA quando houver chave). */
export async function gerarResumoOperacional(): Promise<ResumoOperacional> {
  const pacote = await montarPacoteOperacoes();
  const seco = resumoSemIA(pacote);

  let texto = seco;
  let comIA = false;

  if (iaConfigurada()) {
    const dados = JSON.stringify(compactar(pacote), null, 1);
    const gerado = await gerarTextoIA(
      SYSTEM,
      `Escreva o resumo de operações de hoje a partir destes dados:\n\n${dados}`,
      1200,
    );
    if (gerado) {
      texto = gerado;
      comIA = true;
    }
  }

  const data = new Date(pacote.geradoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  return {
    texto,
    comIA,
    titulo: `Resumo de operações de ${data}`,
    descricao: linhaResumo(pacote),
    pacote,
  };
}

function escaparHtml(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Texto puro → HTML simples de e-mail (linhas em branco viram parágrafos). */
function textoParaHtml(texto: string): string {
  return escaparHtml(texto)
    .split(/\n{2,}/)
    .map((bloco) => `<p style="margin:0 0 14px">${bloco.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export type EntregaResumo = {
  destinatarios: number;
  notificacoes: number;
  emails: number;
  comIA: boolean;
  pulado: boolean;
};

/**
 * Entrega o resumo à direção: notificação no TREM + e-mail.
 *
 * Vai só para quem tem ADMIN no módulo `admin`, o mesmo recorte da tela
 * /agentes/operacoes. O resumo mostra todos os clientes e a carga de cada
 * pessoa; não pode chegar mais longe do que a tela que ele resume.
 */
export async function entregarResumoOperacional(opts: { forcar?: boolean } = {}): Promise<EntregaResumo> {
  const destinatarios = await db.usuario.findMany({
    where: {
      ativo: true,
      perfil: { capacidades: { some: { modulo: "admin", nivel: "ADMIN" } } },
    },
    select: { id: true, nome: true, email: true },
  });

  if (destinatarios.length === 0) {
    return { destinatarios: 0, notificacoes: 0, emails: 0, comIA: false, pulado: true };
  }

  // Não repetir no mesmo expediente (a função agendada pode ser reexecutada).
  const dedup = new Date(Date.now() - 20 * 3600 * 1000);
  if (!opts.forcar) {
    const ja = await db.notificacao.findFirst({
      where: { tipo: "resumo_operacoes", criadoEm: { gte: dedup } },
      select: { id: true },
    });
    if (ja) return { destinatarios: destinatarios.length, notificacoes: 0, emails: 0, comIA: false, pulado: true };
  }

  const { texto, titulo, descricao, comIA } = await gerarResumoOperacional();

  const base = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.URL ||
    "https://trem.agenciaplante.com.br"
  ).replace(/\/$/, "");
  const emailOn = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;

  let notificacoes = 0;
  let emails = 0;

  for (const u of destinatarios) {
    await db.notificacao.create({
      data: {
        usuarioId: u.id,
        tipo: "resumo_operacoes",
        titulo,
        descricao,
        entidadeTipo: "agentes",
        url: "/agentes/operacoes",
      },
    });
    notificacoes++;

    if (emailOn && u.email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM,
            to: [u.email],
            subject: `${titulo} (TREM)`,
            html:
              `<div style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.5;max-width:620px">` +
              `<h2 style="margin:0 0 4px">${escaparHtml(titulo)}</h2>` +
              `<p style="margin:0 0 18px;color:#666;font-size:13px">${escaparHtml(descricao)}</p>` +
              textoParaHtml(texto) +
              `<p style="margin:22px 0 0"><a href="${base}/agentes/operacoes" style="background:#F7FF19;color:#050505;text-decoration:none;font-weight:700;padding:10px 18px;border-radius:8px;display:inline-block">Ver os dados completos</a></p>` +
              `<p style="margin:18px 0 0;color:#888;font-size:12px">` +
              (comIA
                ? "Resumo escrito por IA a partir dos registros do TREM. É sugestão, confira antes de agir."
                : "Resumo automático (sem IA configurada). Números direto dos registros do TREM.") +
              `</p></div>`,
          }),
        });
        emails++;
      } catch {
        /* e-mail é best-effort, a notificação no TREM já foi criada */
      }
    }
  }

  return { destinatarios: destinatarios.length, notificacoes, emails, comIA, pulado: false };
}
