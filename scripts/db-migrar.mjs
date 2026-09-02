// Aplica as migracoes pendentes do Prisma usando node-postgres.
//
// Por que existe: o engine do Prisma nao fecha a conexao TLS com o Neon nesta
// maquina (problema de SNI do conector), entao `prisma migrate deploy` estoura
// P1001. O node-postgres manda o SNI certo e conecta normalmente. Este script
// faz o mesmo que o `migrate deploy`: roda o migration.sql das pendentes e
// registra em "_prisma_migrations" com o checksum sha256 do arquivo, mantendo
// o historico do Prisma consistente (o `prisma migrate` volta a reconhecer).
//
// Uso: npm run db:migrar   (ou: node scripts/db-migrar.mjs)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR_MIG = path.join(RAIZ, "prisma", "migrations");

// Carrega DATABASE_URL do .env se ainda nao estiver no ambiente.
if (!process.env.DATABASE_URL && existsSync(path.join(RAIZ, ".env"))) {
  const env = readFileSync(path.join(RAIZ, ".env"), "utf8");
  for (const l of env.split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL nao definida."); process.exit(1); }

const sha = (buf) => createHash("sha256").update(buf).digest("hex");

function conectar() {
  const u = new URL(process.env.DATABASE_URL);
  return new pg.Client({
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || undefined,
    // sslmode=require do Neon: criptografa sem exigir verificacao de CA.
    ssl: { servername: u.hostname, rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
    statement_timeout: 0,
  });
}

async function main() {
  const client = conectar();
  await client.connect();
  try {
    const existeTabela = (await client.query(
      `SELECT to_regclass('"_prisma_migrations"') AS t`,
    )).rows[0].t;
    if (!existeTabela) { console.error('Tabela "_prisma_migrations" nao existe. Rode a primeira migracao pelo Prisma.'); process.exit(1); }

    const aplicadas = new Map(
      (await client.query(`SELECT migration_name, checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL`))
        .rows.map((r) => [r.migration_name, r.checksum]),
    );

    const pastas = readdirSync(DIR_MIG, { withFileTypes: true })
      .filter((d) => d.isDirectory() && existsSync(path.join(DIR_MIG, d.name, "migration.sql")))
      .map((d) => d.name)
      .sort();

    // Aviso de drift: migracao ja aplicada cujo arquivo mudou.
    for (const nome of pastas) {
      const chkArq = sha(readFileSync(path.join(DIR_MIG, nome, "migration.sql")));
      if (aplicadas.has(nome) && aplicadas.get(nome) !== chkArq) {
        console.warn(`AVISO: checksum diferente na ja aplicada ${nome} (arquivo mudou depois de aplicada).`);
      }
    }

    const pendentes = pastas.filter((n) => !aplicadas.has(n));
    if (pendentes.length === 0) { console.log("Nenhuma migracao pendente. Banco em dia."); return; }

    console.log(`Pendentes: ${pendentes.length}`);
    for (const nome of pendentes) {
      const arq = readFileSync(path.join(DIR_MIG, nome, "migration.sql"));
      process.stdout.write(`  aplicando ${nome} ... `);
      await client.query("BEGIN");
      try {
        await client.query(arq.toString("utf8"));
        await client.query(
          `INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
           VALUES ($1, $2, now(), $3, NULL, NULL, now(), 1)`,
          [randomUUID(), sha(arq), nome],
        );
        await client.query("COMMIT");
        console.log("ok");
      } catch (e) {
        await client.query("ROLLBACK");
        console.log("FALHOU");
        throw e;
      }
    }
    console.log("Concluido.");
  } finally {
    await client.end();
  }
}

main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
