import "server-only";
import { db } from "@/lib/db";
import type { NfStatus } from "@prisma/client";

export type NotaFiscalView = {
  id: string;
  status: NfStatus;
  numero: string | null;
  codigoVerificacao: string | null;
  valor: number;
  descricao: string;
  urlPdf: string | null;
  urlXml: string | null;
  mensagemErro: string | null;
  criadoEm: Date;
};

export async function listarNotasDaOs(osId: string): Promise<NotaFiscalView[]> {
  const notas = await db.notaFiscal.findMany({ where: { osId }, orderBy: { criadoEm: "desc" } });
  return notas.map((n) => ({
    id: n.id,
    status: n.status,
    numero: n.numero,
    codigoVerificacao: n.codigoVerificacao,
    valor: Number(n.valor),
    descricao: n.descricao,
    urlPdf: n.urlPdf,
    urlXml: n.urlXml,
    mensagemErro: n.mensagemErro,
    criadoEm: n.criadoEm,
  }));
}
