import { z } from "zod";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "@/lib/utils";

// ───────────────────────────── Tipos ─────────────────────────────

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "tel"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "checkbox";

/** Definição de campo — a parte SERIALIZÁVEL vai para o formulário (client). */
export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[];
  /** Quando as opções são carregadas em runtime (ex.: categoria-pai). */
  dynamicOptions?: string;
  colSpan?: 1 | 2;
};

export type Coluna<T = Registro> = {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export type SoftDelete = {
  field: "arquivado" | "ativo";
  /** Valor do campo que significa "fora de uso" (arquivado/inativo). */
  arquivadoValue: boolean;
};

export type Registro = Record<string, unknown> & { id: string };

export type EntityConfig = {
  slug: string;
  model: string; // delegate do Prisma (ex.: "cliente")
  rotulo: string; // singular
  rotuloPlural: string;
  descricao?: string;
  campos: FieldDef[];
  schema: z.ZodTypeAny;
  colunas: Coluna[];
  buscaFields: string[];
  ordenarPor: string;
  softDelete: SoftDelete | null;
};

// ─────────────────────── Opções de enums ───────────────────────

export const VEICULO_TIPOS = [
  { value: "RADIO", label: "Rádio" },
  { value: "TV", label: "TV" },
  { value: "EXTERIOR", label: "Exterior / Outdoor" },
  { value: "DIGITAL", label: "Digital" },
  { value: "JORNAL", label: "Jornal" },
  { value: "REVISTA", label: "Revista" },
  { value: "OUTRO", label: "Outro" },
];

export const CATEGORIA_TIPOS = [
  { value: "RECEITA", label: "Receita" },
  { value: "DESPESA", label: "Despesa" },
];

// ─────────────────────── Helpers de schema ───────────────────────

const textoOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null));

const nomeObrigatorio = z.string().trim().min(1, "Informe o nome.");

const dataOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(`${v}T12:00:00`) : null))
  .refine((v) => v === null || !Number.isNaN(v.getTime()), { message: "Data inválida." });

const emailOpcional = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || z.string().email().safeParse(v).success, {
    message: "E-mail inválido.",
  });

// ─────────────────────── Configs por entidade ───────────────────────

function fmtDia(v: unknown): string {
  if (!v) return "—";
  const d = new Date(v as string | Date);
  return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(d);
}

function statusBadge(arquivado: boolean) {
  return arquivado ? (
    <Badge variant="muted">Arquivado</Badge>
  ) : (
    <Badge variant="success">Ativo</Badge>
  );
}

export const ENTIDADES: Record<string, EntityConfig> = {
  clientes: {
    slug: "clientes",
    model: "cliente",
    rotulo: "Cliente",
    rotuloPlural: "Clientes",
    descricao: "Donos dos projetos, propostas, jobs e mídia.",
    softDelete: { field: "arquivado", arquivadoValue: true },
    buscaFields: ["nome", "nomeFantasia", "documento"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Razão social / Nome", type: "text", required: true, colSpan: 2 },
      { name: "nomeFantasia", label: "Nome fantasia", type: "text" },
      { name: "documento", label: "CNPJ / CPF", type: "text" },
      { name: "inscricaoEstadual", label: "Inscrição estadual", type: "text" },
      { name: "inscricaoMunicipal", label: "Inscrição municipal", type: "text" },
      { name: "email", label: "E-mail", type: "email" },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "contatoNome", label: "Contato (nome)", type: "text" },
      { name: "cep", label: "CEP", type: "text" },
      { name: "endereco", label: "Endereço", type: "textarea", colSpan: 2 },
      {
        name: "condicoesComerciais",
        label: "Condições comerciais",
        type: "textarea",
        colSpan: 2,
        help: "Prazos, formas de pagamento, observações.",
      },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      nomeFantasia: textoOpcional,
      documento: textoOpcional,
      inscricaoEstadual: textoOpcional,
      inscricaoMunicipal: textoOpcional,
      email: emailOpcional,
      telefone: textoOpcional,
      contatoNome: textoOpcional,
      cep: textoOpcional,
      endereco: textoOpcional,
      condicoesComerciais: textoOpcional,
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Fantasia", render: (r) => (r.nomeFantasia as string) ?? "—" },
      { header: "Documento", render: (r) => (r.documento as string) ?? "—" },
      { header: "Status", render: (r) => statusBadge(Boolean(r.arquivado)) },
    ],
  },

  colaboradores: {
    slug: "colaboradores",
    model: "colaborador",
    rotulo: "Colaborador",
    rotuloPlural: "Colaboradores",
    descricao: "Equipe interna — recebem jobs e apontam horas.",
    softDelete: { field: "ativo", arquivadoValue: false },
    buscaFields: ["nome", "email", "funcao", "documento"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 },
      { name: "funcao", label: "Função", type: "text" },
      { name: "documento", label: "CPF / CNPJ", type: "text" },
      { name: "email", label: "E-mail", type: "email" },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "dataNascimento", label: "Aniversário", type: "date" },
      { name: "dataAdmissao", label: "Admissão", type: "date" },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      funcao: textoOpcional,
      documento: textoOpcional,
      email: emailOpcional,
      telefone: textoOpcional,
      dataNascimento: dataOpcional,
      dataAdmissao: dataOpcional,
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Função", render: (r) => (r.funcao as string) ?? "—" },
      { header: "E-mail", render: (r) => (r.email as string) ?? "—" },
      { header: "Aniversário", render: (r) => fmtDia(r.dataNascimento) },
      { header: "Status", render: (r) => statusBadge(!(r.ativo as boolean)) },
    ],
  },

  fornecedores: {
    slug: "fornecedores",
    model: "fornecedor",
    rotulo: "Fornecedor",
    rotuloPlural: "Fornecedores",
    descricao: "Terceiros ligados a despesas.",
    softDelete: { field: "arquivado", arquivadoValue: true },
    buscaFields: ["nome", "documento", "contato"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 },
      { name: "razaoSocial", label: "Razão social", type: "text" },
      { name: "documento", label: "CNPJ / CPF", type: "text" },
      { name: "inscricaoMunicipal", label: "Inscrição municipal", type: "text" },
      { name: "contato", label: "Contato", type: "text" },
      { name: "email", label: "E-mail", type: "email" },
      { name: "telefone", label: "Telefone", type: "tel" },
      { name: "cep", label: "CEP", type: "text" },
      { name: "endereco", label: "Endereço", type: "textarea", colSpan: 2 },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      razaoSocial: textoOpcional,
      documento: textoOpcional,
      inscricaoMunicipal: textoOpcional,
      contato: textoOpcional,
      email: emailOpcional,
      telefone: textoOpcional,
      cep: textoOpcional,
      endereco: textoOpcional,
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Documento", render: (r) => (r.documento as string) ?? "—" },
      { header: "Contato", render: (r) => (r.contato as string) ?? "—" },
      { header: "Status", render: (r) => statusBadge(Boolean(r.arquivado)) },
    ],
  },

  prestadores: {
    slug: "prestadores",
    model: "prestador",
    rotulo: "Prestador",
    rotuloPlural: "Prestadores de serviço",
    descricao: "Terceiros que executam produção.",
    softDelete: { field: "arquivado", arquivadoValue: true },
    buscaFields: ["nome", "servico", "documento"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 },
      { name: "servico", label: "Serviço", type: "text" },
      { name: "documento", label: "CNPJ / CPF", type: "text" },
      { name: "contato", label: "Contato", type: "text" },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      servico: textoOpcional,
      documento: textoOpcional,
      contato: textoOpcional,
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Serviço", render: (r) => (r.servico as string) ?? "—" },
      { header: "Contato", render: (r) => (r.contato as string) ?? "—" },
      { header: "Status", render: (r) => statusBadge(Boolean(r.arquivado)) },
    ],
  },

  veiculos: {
    slug: "veiculos",
    model: "veiculo",
    rotulo: "Veículo",
    rotuloPlural: "Veículos",
    descricao: "Emissoras, rádios, portais e outdoors para planos de mídia.",
    softDelete: { field: "arquivado", arquivadoValue: true },
    buscaFields: ["nome", "contatoNome"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome do veículo", type: "text", required: true, colSpan: 2 },
      { name: "tipo", label: "Tipo", type: "select", required: true, options: VEICULO_TIPOS },
      { name: "razaoSocial", label: "Razão social", type: "text" },
      { name: "documento", label: "CNPJ", type: "text" },
      { name: "inscricaoMunicipal", label: "Inscrição municipal", type: "text" },
      { name: "cep", label: "CEP", type: "text" },
      { name: "endereco", label: "Endereço", type: "textarea", colSpan: 2 },
      { name: "contatoNome", label: "Contato (nome)", type: "text" },
      { name: "contatoEmail", label: "Contato (e-mail)", type: "email" },
      { name: "contatoTelefone", label: "Contato (telefone)", type: "tel" },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      tipo: z.enum(["RADIO", "TV", "EXTERIOR", "DIGITAL", "JORNAL", "REVISTA", "OUTRO"], {
        message: "Selecione o tipo.",
      }),
      razaoSocial: textoOpcional,
      documento: textoOpcional,
      inscricaoMunicipal: textoOpcional,
      cep: textoOpcional,
      endereco: textoOpcional,
      contatoNome: textoOpcional,
      contatoEmail: emailOpcional,
      contatoTelefone: textoOpcional,
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      {
        header: "Tipo",
        render: (r) => (
          <Badge variant="outline">
            {VEICULO_TIPOS.find((t) => t.value === r.tipo)?.label ?? String(r.tipo)}
          </Badge>
        ),
      },
      { header: "Contato", render: (r) => (r.contatoNome as string) ?? "—" },
      { header: "Status", render: (r) => statusBadge(Boolean(r.arquivado)) },
    ],
  },

  produtos: {
    slug: "produtos",
    model: "produto",
    rotulo: "Produto / Serviço",
    rotuloPlural: "Produtos e serviços",
    descricao: "Catálogo usado como itens de proposta.",
    softDelete: { field: "ativo", arquivadoValue: false },
    buscaFields: ["nome", "descricao"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 },
      { name: "descricao", label: "Descrição", type: "textarea", colSpan: 2 },
      { name: "valorUnit", label: "Valor unitário (R$)", type: "currency", required: true },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      descricao: textoOpcional,
      valorUnit: z.coerce.number({ message: "Informe um valor." }).min(0, "Valor inválido."),
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Descrição", render: (r) => (r.descricao as string) ?? "—" },
      {
        header: "Valor unit.",
        className: "text-right tabular-nums",
        render: (r) => formatBRL(Number(r.valorUnit)),
      },
      { header: "Status", render: (r) => statusBadge(!(r.ativo as boolean)) },
    ],
  },

  categorias: {
    slug: "categorias",
    model: "categoria",
    rotulo: "Categoria",
    rotuloPlural: "Categorias (plano de contas)",
    descricao: "Classificação de receitas e despesas, em árvore.",
    softDelete: { field: "ativo", arquivadoValue: false },
    buscaFields: ["nome"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 },
      { name: "tipo", label: "Tipo", type: "select", required: true, options: CATEGORIA_TIPOS },
      {
        name: "paiId",
        label: "Categoria-pai",
        type: "select",
        dynamicOptions: "categoriasPai",
        help: "Opcional — para montar o plano de contas em níveis.",
        colSpan: 2,
      },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      tipo: z.enum(["RECEITA", "DESPESA"], { message: "Selecione o tipo." }),
      paiId: z
        .string()
        .trim()
        .optional()
        .transform((v) => (v ? v : null)),
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      {
        header: "Tipo",
        render: (r) =>
          r.tipo === "RECEITA" ? (
            <Badge variant="success">Receita</Badge>
          ) : (
            <Badge variant="warning">Despesa</Badge>
          ),
      },
      {
        header: "Categoria-pai",
        render: (r) => ((r.pai as { nome?: string })?.nome ?? "—"),
      },
      { header: "Status", render: (r) => statusBadge(!(r.ativo as boolean)) },
    ],
  },

  "centros-custo": {
    slug: "centros-custo",
    model: "centroCusto",
    rotulo: "Centro de custo",
    rotuloPlural: "Centros de custo",
    descricao: "Para rateio financeiro.",
    softDelete: { field: "ativo", arquivadoValue: false },
    buscaFields: ["nome"],
    ordenarPor: "nome",
    campos: [{ name: "nome", label: "Nome", type: "text", required: true, colSpan: 2 }],
    schema: z.object({ nome: nomeObrigatorio }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      { header: "Status", render: (r) => statusBadge(!(r.ativo as boolean)) },
    ],
  },

  contas: {
    slug: "contas",
    model: "contaBancaria",
    rotulo: "Conta bancária",
    rotuloPlural: "Contas bancárias",
    descricao: "Saldo inicial para o financeiro.",
    softDelete: { field: "ativo", arquivadoValue: false },
    buscaFields: ["nome"],
    ordenarPor: "nome",
    campos: [
      { name: "nome", label: "Nome da conta", type: "text", required: true, colSpan: 2 },
      { name: "saldoInicial", label: "Saldo inicial (R$)", type: "currency", required: true },
    ],
    schema: z.object({
      nome: nomeObrigatorio,
      saldoInicial: z.coerce.number({ message: "Informe um valor." }),
    }),
    colunas: [
      { header: "Nome", render: (r) => <span className="font-medium">{String(r.nome)}</span> },
      {
        header: "Saldo inicial",
        className: "text-right tabular-nums",
        render: (r) => formatBRL(Number(r.saldoInicial)),
      },
      { header: "Status", render: (r) => statusBadge(!(r.ativo as boolean)) },
    ],
  },
};

export function getEntidade(slug: string): EntityConfig | null {
  return ENTIDADES[slug] ?? null;
}

/** Subconjunto serializável dos campos (para passar ao formulário client). */
export function camposSerializaveis(config: EntityConfig): FieldDef[] {
  return config.campos;
}
