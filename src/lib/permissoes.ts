import type { NivelAcesso, Papel } from "@prisma/client";

/**
 * Permissões por PERFIL (personalizável). Parte PURA — sem acesso a banco, testável.
 * Cada perfil define um nível por módulo; do conjunto derivamos o "papel" legado
 * (poder: SÓCIO > GESTOR > OPERADOR) para manter as checagens já existentes.
 */

export const MODULOS = [
  { key: "projetos", label: "Projetos" },
  { key: "jobs", label: "Jobs" },
  { key: "propostas", label: "Propostas" },
  { key: "midia", label: "Mídia" },
  { key: "producao", label: "Produção" },
  { key: "financeiro", label: "Financeiro" },
  { key: "relatorios", label: "Relatórios" },
  { key: "cadastros", label: "Cadastros" },
  { key: "admin", label: "Administração" },
] as const;

export type ModuloKey = (typeof MODULOS)[number]["key"];

export const NIVEL_LABEL: Record<NivelAcesso, string> = {
  NENHUM: "Sem acesso",
  VER: "Ver",
  EDITAR: "Editar",
  ADMIN: "Administrar",
};

const PESO_NIVEL: Record<NivelAcesso, number> = {
  NENHUM: 0,
  VER: 1,
  EDITAR: 2,
  ADMIN: 3,
};

export type Capacidades = Record<ModuloKey, NivelAcesso>;

/** True se `nivel` atende ao mínimo exigido. */
export function nivelAtende(nivel: NivelAcesso, minimo: NivelAcesso): boolean {
  return PESO_NIVEL[nivel] >= PESO_NIVEL[minimo];
}

/** True se as capacidades atendem ao mínimo no módulo. */
export function podeModulo(caps: Capacidades, modulo: ModuloKey, minimo: NivelAcesso): boolean {
  return nivelAtende(caps[modulo], minimo);
}

/** Preenche módulos ausentes com NENHUM, garantindo um mapa completo. */
export function completarCaps(parcial: Partial<Capacidades>): Capacidades {
  const out = {} as Capacidades;
  for (const m of MODULOS) out[m.key] = parcial[m.key] ?? "NENHUM";
  return out;
}

/**
 * Deriva o papel legado (poder) a partir das capacidades:
 * - Responsável da conta ou ADMIN em Administração → Sócio-diretor.
 * - ADMIN em qualquer módulo operacional → Sócio-diretor (pode excluir).
 * - EDITAR em algum módulo → Gestor.
 * - caso contrário → Operador.
 */
export function derivarPapel(caps: Capacidades, responsavelConta = false): Papel {
  if (responsavelConta || caps.admin === "ADMIN") return "SOCIO_DIRETOR";
  const operacionais = MODULOS.filter((m) => m.key !== "admin").map((m) => caps[m.key]);
  if (operacionais.some((n) => n === "ADMIN")) return "SOCIO_DIRETOR";
  if (operacionais.some((n) => n === "EDITAR")) return "GESTOR";
  return "OPERADOR";
}

/** Capacidades equivalentes a um papel legado (fallback p/ usuários sem perfil). */
export function capacidadesDoPapel(papel: Papel): Capacidades {
  const nivel: NivelAcesso =
    papel === "SOCIO_DIRETOR" ? "ADMIN" : papel === "GESTOR" ? "EDITAR" : "VER";
  const parcial = {} as Partial<Capacidades>;
  for (const m of MODULOS) parcial[m.key] = m.key === "admin" ? (papel === "SOCIO_DIRETOR" ? "ADMIN" : "NENHUM") : nivel;
  return completarCaps(parcial);
}

/** True se o perfil dá acesso ao sistema (algum módulo diferente de NENHUM). */
export function temAlgumAcesso(caps: Capacidades): boolean {
  return MODULOS.some((m) => caps[m.key] !== "NENHUM");
}

// ─────────────────────── Perfis-base (seed; editáveis, não excluíveis) ───────────────────────

export type PerfilPadrao = {
  nome: string;
  descricao: string;
  caps: Partial<Capacidades>;
};

const TODOS_ADMIN = Object.fromEntries(MODULOS.map((m) => [m.key, "ADMIN"])) as Capacidades;
const OPERACIONAIS_ADMIN = { ...TODOS_ADMIN, admin: "NENHUM" } as Capacidades;

export const PERFIS_PADRAO: PerfilPadrao[] = [
  {
    nome: "Administrador",
    descricao: "Acesso total ao sistema, incluindo usuários, perfis e dados da empresa.",
    caps: TODOS_ADMIN,
  },
  {
    nome: "Total",
    descricao: "Acesso total às áreas operacionais e financeiras. Não administra usuários.",
    caps: OPERACIONAIS_ADMIN,
  },
  {
    nome: "Atendimento",
    descricao: "Projetos, jobs, propostas e clientes. Sem acesso ao financeiro.",
    caps: {
      projetos: "EDITAR", jobs: "EDITAR", propostas: "EDITAR",
      midia: "VER", producao: "VER", financeiro: "NENHUM",
      relatorios: "VER", cadastros: "EDITAR", admin: "NENHUM",
    },
  },
  {
    nome: "Criativo",
    descricao: "Projetos e jobs (pauta criativa). Visualiza propostas.",
    caps: {
      projetos: "EDITAR", jobs: "EDITAR", propostas: "VER",
      midia: "NENHUM", producao: "NENHUM", financeiro: "NENHUM",
      relatorios: "NENHUM", cadastros: "VER", admin: "NENHUM",
    },
  },
  {
    nome: "Tráfego",
    descricao: "Mídia e jobs relacionados. Acompanha relatórios de mídia.",
    caps: {
      projetos: "VER", jobs: "EDITAR", propostas: "NENHUM",
      midia: "EDITAR", producao: "VER", financeiro: "NENHUM",
      relatorios: "VER", cadastros: "VER", admin: "NENHUM",
    },
  },
  {
    nome: "Mídia",
    descricao: "Planejamento de mídia e produção.",
    caps: {
      projetos: "VER", jobs: "EDITAR", propostas: "NENHUM",
      midia: "EDITAR", producao: "EDITAR", financeiro: "NENHUM",
      relatorios: "VER", cadastros: "VER", admin: "NENHUM",
    },
  },
  {
    nome: "Sem acesso",
    descricao: "Usuário sem nenhum acesso ao sistema (bloqueado).",
    caps: {},
  },
];
