/** Catálogo dos campos do dossiê estratégico (Estação do Cliente). */
export const CAMPOS_DOSSIE = [
  { name: "antesDeProduzir", label: "O que precisamos saber antes de produzir", destaque: true, help: "A regra de ouro da conta — o que ninguém pode ignorar ao criar uma entrega." },
  { name: "apresentacao", label: "Apresentação da empresa" },
  { name: "segmento", label: "Segmento / área de atuação" },
  { name: "aprovadores", label: "Responsáveis e aprovadores (lado do cliente)" },
  { name: "objetivosNegocio", label: "Objetivos de negócio" },
  { name: "objetivosComunicacao", label: "Objetivos de comunicação" },
  { name: "publicoAlvo", label: "Público-alvo" },
  { name: "produtosPrioritarios", label: "Produtos e serviços prioritários" },
  { name: "diferenciais", label: "Diferenciais" },
  { name: "concorrentes", label: "Concorrentes" },
  { name: "posicionamento", label: "Posicionamento" },
  { name: "canaisAtivos", label: "Canais ativos" },
  { name: "restricoes", label: "Restrições e cuidados" },
  { name: "datasImportantes", label: "Datas importantes" },
  { name: "historicoRelacao", label: "Histórico da relação com a Plante" },
] as const;

export type CampoDossie = (typeof CAMPOS_DOSSIE)[number]["name"];
