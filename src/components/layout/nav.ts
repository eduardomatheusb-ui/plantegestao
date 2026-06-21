import {
  LayoutDashboard,
  FolderKanban,
  ListChecks,
  FileText,
  Megaphone,
  Factory,
  Wallet,
  BarChart3,
  Users,
  Contact,
  Truck,
  Hammer,
  Radio,
  Package,
  ListTree,
  Target,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { ModuloKey, Capacidades } from "@/lib/permissoes";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Módulo que controla a visibilidade (perfil de acesso). Sem módulo = sempre visível. */
  modulo?: ModuloKey;
  /** false = módulo de fase futura, exibido como "em breve" (sem link). */
  disponivel?: boolean;
};

export type NavGroup = {
  titulo?: string;
  itens: NavItem[];
};

/** Estrutura do menu lateral. Itens "em breve" ganham vida nas fases seguintes. */
export const NAV: NavGroup[] = [
  {
    itens: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, disponivel: true }],
  },
  {
    titulo: "Trabalho",
    itens: [
      { label: "Projetos", href: "/projetos", icon: FolderKanban, modulo: "projetos", disponivel: true },
      { label: "Jobs", href: "/jobs", icon: ListChecks, modulo: "jobs", disponivel: true },
      { label: "Propostas", href: "/propostas", icon: FileText, modulo: "propostas", disponivel: true },
      { label: "Mídia", href: "/midia", icon: Megaphone, modulo: "midia", disponivel: true },
      { label: "Produção", href: "/producao", icon: Factory, modulo: "producao", disponivel: true },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { label: "Lançamentos", href: "/financeiro", icon: Wallet, modulo: "financeiro", disponivel: true },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3, modulo: "relatorios", disponivel: true },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { label: "Clientes", href: "/cadastros/clientes", icon: Users, modulo: "cadastros", disponivel: true },
      { label: "Colaboradores", href: "/cadastros/colaboradores", icon: Contact, modulo: "cadastros", disponivel: true },
      { label: "Fornecedores", href: "/cadastros/fornecedores", icon: Truck, modulo: "cadastros", disponivel: true },
      { label: "Prestadores", href: "/cadastros/prestadores", icon: Hammer, modulo: "cadastros", disponivel: true },
      { label: "Veículos", href: "/cadastros/veiculos", icon: Radio, modulo: "cadastros", disponivel: true },
      { label: "Produtos", href: "/cadastros/produtos", icon: Package, modulo: "cadastros", disponivel: true },
      { label: "Categorias", href: "/cadastros/categorias", icon: ListTree, modulo: "cadastros", disponivel: true },
      { label: "Centros de custo", href: "/cadastros/centros-custo", icon: Target, modulo: "cadastros", disponivel: true },
      { label: "Contas bancárias", href: "/cadastros/contas", icon: Landmark, modulo: "cadastros", disponivel: true },
    ],
  },
  {
    titulo: "Sistema",
    itens: [
      { label: "Administração", href: "/configuracoes", icon: ShieldCheck, modulo: "admin", disponivel: true },
    ],
  },
];

/** Filtra os grupos/itens do menu pelas capacidades do usuário (esconde módulos sem acesso). */
export function filtrarNav(caps: Capacidades): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    itens: g.itens.filter((i) => !i.modulo || caps[i.modulo] !== "NENHUM"),
  })).filter((g) => g.itens.length > 0);
}
