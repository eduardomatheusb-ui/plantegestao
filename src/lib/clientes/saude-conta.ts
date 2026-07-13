import "server-only";
import { db } from "@/lib/db";
import { resultadosCliente } from "@/lib/clientes/queries";

export type SaudeConta = {
  cor: "verde" | "amarelo" | "vermelho";
  rotulo: string;
  pontos: number;
  motivos: string[];
};

const DIA = 24 * 3600 * 1000;

/**
 * Saúde da conta (Estação do Cliente) — score composto calculado na hora, sempre
 * com o MOTIVO em texto. Eixos: entregas no prazo, atraso atual, tempo de
 * aprovação, retrabalho, pagamentos vencidos (sem valores — só contagem),
 * participação do cliente e risco contratual.
 * Pontos: 0-1 verde · 2-3 amarelo · 4+ vermelho.
 */
export async function saudeConta(clienteId: string): Promise<SaudeConta> {
  const agora = new Date();

  const [resultados, atrasadas, vencidos, ultimaReuniao, ultimoEvento, contratoAtivo] = await Promise.all([
    resultadosCliente(clienteId),
    db.job.count({ where: { clienteId, arquivado: false, status: { isConcluido: false }, prazo: { lt: agora } } }),
    db.lancamento.count({ where: { clienteId, tipo: "RECEITA", status: "EM_ABERTO", dataVencimento: { lt: agora } } }),
    db.reuniao.findFirst({ where: { clienteId }, orderBy: { data: "desc" }, select: { data: true } }),
    db.aprovacaoEvento.findFirst({ where: { job: { clienteId } }, orderBy: { criadoEm: "desc" }, select: { criadoEm: true } }),
    db.contrato.findFirst({
      where: { clienteId, status: "ativo", dataFim: { not: null, gte: agora } },
      orderBy: { dataFim: "asc" },
      select: { dataFim: true },
    }),
  ]);

  const op = resultados.operacionais;
  let pontos = 0;
  const motivos: string[] = [];

  // Entregas no prazo (90d)
  if (op.pctNoPrazo != null) {
    if (op.pctNoPrazo < 60) { pontos += 2; motivos.push(`só ${op.pctNoPrazo}% das entregas no prazo nos últimos 90 dias`); }
    else if (op.pctNoPrazo < 80) { pontos += 1; motivos.push(`${op.pctNoPrazo}% das entregas no prazo nos últimos 90 dias`); }
  }

  // Atraso atual
  if (atrasadas > 5) { pontos += 2; motivos.push(`${atrasadas} demandas atrasadas agora`); }
  else if (atrasadas > 2) { pontos += 1; motivos.push(`${atrasadas} demandas atrasadas agora`); }

  // Tempo de aprovação
  if (op.tempoAprovacao != null) {
    if (op.tempoAprovacao > 10) { pontos += 2; motivos.push(`aprovação média de ${op.tempoAprovacao} dias`); }
    else if (op.tempoAprovacao > 6) { pontos += 1; motivos.push(`aprovação média de ${op.tempoAprovacao} dias`); }
  }

  // Retrabalho
  if (op.rodadasMedia != null && op.rodadasMedia > 2) {
    pontos += 1;
    motivos.push(`retrabalho alto (${op.rodadasMedia} rodadas por peça)`);
  }

  // Pagamentos vencidos (contagem apenas — valores só no bloco financeiro)
  if (vencidos > 0) {
    pontos += 2;
    motivos.push(`${vencidos} pagamento${vencidos === 1 ? "" : "s"} vencido${vencidos === 1 ? "" : "s"}`);
  }

  // Participação do cliente (última interação registrada)
  const ultimaInteracao = [ultimaReuniao?.data, ultimoEvento?.criadoEm]
    .filter((d): d is Date => !!d)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (ultimaInteracao) {
    const dias = Math.floor((agora.getTime() - ultimaInteracao.getTime()) / DIA);
    if (dias > 45) { pontos += 2; motivos.push(`sem interação registrada há ${dias} dias`); }
    else if (dias > 21) { pontos += 1; motivos.push(`última interação há ${dias} dias`); }
  }

  // Risco contratual
  if (contratoAtivo?.dataFim) {
    const dias = Math.ceil((contratoAtivo.dataFim.getTime() - agora.getTime()) / DIA);
    if (dias <= 45) { pontos += 1; motivos.push(`contrato encerra em ${dias} dia${dias === 1 ? "" : "s"}`); }
  }

  const cor = pontos <= 1 ? "verde" : pontos <= 3 ? "amarelo" : "vermelho";
  const rotulo = cor === "verde" ? "Conta nos trilhos" : cor === "amarelo" ? "Exige atenção" : "Risco elevado";
  return { cor, rotulo, pontos, motivos };
}
