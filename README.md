# Plante Gestão

Sistema interno de gestão da **Plante Comunicação** (projetos, jobs, propostas, mídia,
financeiro e relatórios). Uso interno, código próprio.

> **Status:** Fases 1 (Fundação) e 2 (Cadastros) concluídas. Próximas fases: Projetos →
> Jobs → Propostas → Financeiro → Mídia → Relatórios.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind + shadcn/ui · Prisma ·
PostgreSQL · Auth.js (e-mail+senha) · Vitest.

## Rodando localmente

Pré-requisito: **Node 22+** e um **PostgreSQL**. A forma mais simples é via Docker:

```bash
# 1. Subir o banco (Postgres em :5432)
docker compose up -d

# 2. Variáveis de ambiente
cp .env.example .env        # ajuste AUTH_SECRET se quiser

# 3. Instalar dependências e gerar o client
npm install

# 4. Criar as tabelas e popular dados de exemplo
npm run db:migrate          # cria o schema
npm run db:seed             # 3 usuários + cadastros de exemplo

# 5. Rodar
npm run dev                 # http://localhost:3000
```

> Sem Docker? Aponte `DATABASE_URL` no `.env` para qualquer Postgres (ex.: Neon,
> Supabase) e rode os passos 3–5.

## Usuários do seed (senha: `plante123`)

| Papel          | E-mail                  | Pode                                  |
| -------------- | ----------------------- | ------------------------------------- |
| Sócio-diretor  | eduardo@plante.com.br   | tudo, incluindo excluir definitivamente |
| Gestor         | gestor@plante.com.br    | criar, editar e arquivar cadastros    |
| Operador       | operador@plante.com.br  | somente leitura dos cadastros         |

## Scripts

- `npm run dev` / `build` / `start`
- `npm run typecheck` — TypeScript sem emitir
- `npm run test` — Vitest (lógica de cálculo)
- `npm run db:migrate` / `db:seed` / `db:studio`

## Estrutura

- `src/app` — rotas (App Router). `(auth)` login · `(app)` área autenticada.
- `src/components/ui` — base shadcn/ui. `src/components/shared` — reutilizáveis
  (DataTable, ConfirmButton, HistoryPanel…). `src/components/layout` — sidebar/topbar.
- `src/lib` — `db` (Prisma), `auth`, `rbac`, `sequence` (numeração), `log` (auditoria),
  `cadastros/*` (motor genérico de CRUD dos dados-mestre).
- `prisma/schema.prisma` — modelo de dados. `prisma/seed.ts` — dados de exemplo.

## Design system

Tokens da marca Plante em `src/app/globals.css` (amarelo `#F7FF19` só com texto escuro;
chrome escuro + conteúdo claro). Fontes Space Grotesk (títulos) + Inter (corpo).
