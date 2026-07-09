/**
 * Fluxo de tarefas padrão por TIPO de job. Ao criar um job, o sistema gera
 * automaticamente essas subtarefas (na ordem). É ponto de partida, não camisa
 * de força: o usuário edita, exclui ou acrescenta depois. "outro" nasce vazio.
 */

const F = {
  padrao: ["Briefing", "Criação", "Revisão", "Aprovação Interna", "Aprovação Externa", "Entrega / Publicação"],
  carrossel: ["Briefing", "Texto / Roteiro", "Criação", "Revisão", "Aprovação Interna", "Aprovação Externa", "Publicação"],
  video: ["Briefing", "Roteiro", "Produção / Edição", "Revisão", "Aprovação Interna", "Aprovação Externa", "Entrega / Publicação"],
  marca: ["Briefing", "Pesquisa / Diagnóstico", "Desenvolvimento", "Revisão", "Aprovação Interna", "Aprovação Externa", "Entrega"],
  web: ["Briefing", "Layout", "Desenvolvimento", "Revisão / Testes", "Aprovação Interna", "Aprovação Externa", "Publicação"],
  trafego: ["Briefing", "Planejamento", "Criação", "Aprovação Interna", "Aprovação Externa", "Publicação"],
} as const;

/** tipo (chave de TIPOS_JOB) → lista ordenada de tarefas. */
const FLUXOS: Record<string, readonly string[]> = {
  post_estatico: F.padrao,
  story: F.padrao,
  material_grafico: F.padrao,
  carrossel: F.carrossel,
  reels: F.video,
  video: F.video,
  motion: F.video,
  identidade: F.marca,
  branding: F.marca,
  web: F.web,
  trafego: F.trafego,
  outro: [],
};

/** Tarefas padrão do tipo (vazio para "outro" ou tipo desconhecido). */
export function fluxoDoTipo(tipo: string | null | undefined): string[] {
  return [...(FLUXOS[tipo ?? ""] ?? [])];
}
