import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Semeando Plante Gestão…");

  // ── Usuários (3 papéis) ──────────────────────────────────────────────
  const senhaHash = bcrypt.hashSync("plante123", 10);
  const usuarios = [
    { nome: "Eduardo (Sócio-diretor)", email: "eduardo@plante.com.br", papel: "SOCIO_DIRETOR" as const },
    { nome: "Gestora de Contas", email: "gestor@plante.com.br", papel: "GESTOR" as const },
    { nome: "Operador de Criação", email: "operador@plante.com.br", papel: "OPERADOR" as const },
  ];
  for (const u of usuarios) {
    await db.usuario.upsert({
      where: { email: u.email },
      update: { nome: u.nome, papel: u.papel },
      create: { ...u, senhaHash },
    });
  }
  console.log(`  ✓ ${usuarios.length} usuários (senha: plante123)`);

  // ── Clientes ─────────────────────────────────────────────────────────
  if ((await db.cliente.count()) === 0) {
    await db.cliente.createMany({
      data: [
        { nome: "Passaletti Móveis", nomeFantasia: "Passaletti", documento: "12.345.678/0001-90", email: "marketing@passaletti.com.br", telefone: "(31) 3333-1000" },
        { nome: "Supermercado Del Rey Ltda", nomeFantasia: "Del Rey", documento: "98.765.432/0001-10", email: "contato@delrey.com.br", telefone: "(31) 3222-2000" },
        { nome: "Construtora Aurora", nomeFantasia: "Aurora", documento: "11.222.333/0001-44", email: "comunicacao@aurora.com.br" },
      ],
    });
    console.log("  ✓ 3 clientes");
  }

  // ── Veículos + Programas ─────────────────────────────────────────────
  if ((await db.veiculo.count()) === 0) {
    const itatiaia = await db.veiculo.create({
      data: {
        nome: "Rádio Itatiaia",
        tipo: "RADIO",
        contatoNome: "Comercial Itatiaia",
        contatoEmail: "comercial@itatiaia.com.br",
        programas: {
          create: [
            { nome: "Plantão da Cidade", formatoPadrao: '30"' },
            { nome: "Flash Ao-vivo", formatoPadrao: '60"' },
          ],
        },
      },
    });
    await db.veiculo.create({ data: { nome: "TV Alterosa", tipo: "TV", contatoNome: "Comercial Alterosa" } });
    await db.veiculo.create({ data: { nome: "BH Mídia Exterior", tipo: "EXTERIOR" } });
    console.log(`  ✓ 3 veículos (Itatiaia ${itatiaia.id.slice(0, 6)}… com 2 programas)`);
  }

  // ── Praças ───────────────────────────────────────────────────────────
  if ((await db.praca.count()) === 0) {
    await db.praca.createMany({
      data: [
        { nome: "Belo Horizonte", uf: "MG" },
        { nome: "Betim", uf: "MG" },
        { nome: "Contagem", uf: "MG" },
      ],
    });
    console.log("  ✓ 3 praças");
  }

  // ── Produtos / Serviços ──────────────────────────────────────────────
  if ((await db.produto.count()) === 0) {
    await db.produto.createMany({
      data: [
        { nome: "Criação de campanha", descricao: "Conceito, peças e desdobramentos.", valorUnit: "8500.00" },
        { nome: "Gestão de redes sociais (mensal)", descricao: "Planejamento, conteúdo e relatórios.", valorUnit: "3200.00" },
        { nome: "Produção de vídeo 30s", descricao: "Roteiro, captação e edição.", valorUnit: "6000.00" },
      ],
    });
    console.log("  ✓ 3 produtos");
  }

  // ── Plano de contas (categorias em árvore) ───────────────────────────
  if ((await db.categoria.count()) === 0) {
    const receita = await db.categoria.create({ data: { nome: "Receita de serviços", tipo: "RECEITA" } });
    await db.categoria.createMany({
      data: [
        { nome: "Honorários de agência", tipo: "RECEITA", paiId: receita.id },
        { nome: "Veiculação", tipo: "RECEITA", paiId: receita.id },
      ],
    });
    const custos = await db.categoria.create({ data: { nome: "Custos de produção", tipo: "DESPESA" } });
    await db.categoria.createMany({
      data: [
        { nome: "Fornecedores", tipo: "DESPESA", paiId: custos.id },
        { nome: "Mídia / Veículos", tipo: "DESPESA", paiId: custos.id },
      ],
    });
    const ops = await db.categoria.create({ data: { nome: "Despesas operacionais", tipo: "DESPESA" } });
    await db.categoria.createMany({
      data: [
        { nome: "Salários e encargos", tipo: "DESPESA", paiId: ops.id },
        { nome: "Aluguel e estrutura", tipo: "DESPESA", paiId: ops.id },
      ],
    });
    console.log("  ✓ plano de contas (3 grupos + 6 subcategorias)");
  }

  // ── Centros de custo ─────────────────────────────────────────────────
  if ((await db.centroCusto.count()) === 0) {
    await db.centroCusto.createMany({
      data: [{ nome: "Criação" }, { nome: "Mídia" }, { nome: "Administrativo" }],
    });
    console.log("  ✓ 3 centros de custo");
  }

  // ── Conta bancária ───────────────────────────────────────────────────
  if ((await db.contaBancaria.count()) === 0) {
    await db.contaBancaria.create({
      data: { nome: "Conta Corrente — Banco do Brasil", saldoInicial: "0.00" },
    });
    console.log("  ✓ 1 conta bancária");
  }

  // ── Status de Job (kanban configurável) ─────────────────────────────
  if ((await db.jobStatus.count()) === 0) {
    await db.jobStatus.createMany({
      data: [
        { nome: "Conteúdo", ordem: 1, cor: "#6366f1" },
        { nome: "Aprovação interna", ordem: 2, cor: "#f59e0b" },
        { nome: "Informações pendentes", ordem: 3, cor: "#ef4444" },
        { nome: "Captação de vídeo", ordem: 4, cor: "#0ea5e9" },
        { nome: "Edição de vídeo", ordem: 5, cor: "#8b5cf6" },
        { nome: "Arte / Impressão", ordem: 6, cor: "#ec4899" },
        { nome: "Concluído", ordem: 7, cor: "#22c55e", isConcluido: true },
      ],
    });
    console.log("  ✓ 7 status de job (kanban)");
  }

  console.log("✅ Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
