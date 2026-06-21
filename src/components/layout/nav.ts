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
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: "Projetos", href: "/projetos", icon: FolderKanban, disponivel: true },
      { label: "Jobs", href: "/jobs", icon: ListChecks, disponivel: true },
      { label: "Propostas", href: "/propostas", icon: FileText, disponivel: true },
      { label: "Mídia", href: "/midia", icon: Megaphone, disponivel: true },
      { label: "Produção", href: "/producao", icon: Factory, disponivel: true },
    ],
  },
  {
    titulo: "Financeiro",
    itens: [
      { label: "Lançamentos", href: "/financeiro", icon: Wallet, disponivel: true },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3, disponivel: true },
    ],
  },
  {
    titulo: "Cadastros",
    itens: [
      { label: "Clientes", href: "/cadastros/clientes", icon: Users, disponivel: true },
      { label: "Colaboradores", href: "/cadastros/colaboradores", icon: Contact, disponivel: true },
      { label: "Fornecedores", href: "/cadastros/fornecedores", icon: Truck, disponivel: true },
      { label: "Prestadores", href: "/cadastros/prestadores", icon: Hammer, disponivel: true },
      { label: "Veículos", href: "/cadastros/veiculos", icon: Radio, disponivel: true },
      { label: "Produtos", href: "/cadastros/produtos", icon: Package, disponivel: true },
      { label: "Categorias", href: "/cadastros/categorias", icon: ListTree, disponivel: true },
      { label: "Centros de custo", href: "/cadastros/centros-custo", icon: Target, disponivel: true },
      { label: "Contas bancárias", href: "/cadastros/contas", icon: Landmark, disponivel: true },
    ],
  },
];
