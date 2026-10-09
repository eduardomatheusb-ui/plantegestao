// Copia os anexos do Netlify Blobs para o Cloudflare R2 (ou outro S3).
//
// Por que existe: na saida do Netlify, os arquivos enviados ao TREM ficam no
// Netlify Blobs. O banco guarda so a chave (Anexo.blobKey). Este script le as
// chaves no banco, baixa cada arquivo do Netlify e grava no R2 com a MESMA
// chave, entao nada no banco precisa mudar. Pode rodar mais de uma vez: o que
// ja existe no R2 e pulado.
//
// Precisa no .env (ou no ambiente):
//   DATABASE_URL
//   NETLIFY_SITE_ID, NETLIFY_AUTH_TOKEN   (Netlify: Site configuration > Site ID; User settings > Personal access tokens)
//   S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY  (R2)
//
// Uso: node scripts/migrar-anexos.mjs        (copia)
//      node scripts/migrar-anexos.mjs --teste (so conta, nao copia)
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import { getStore } from "@netlify/blobs";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

if (existsSync(path.join(RAIZ, ".env"))) {
  const env = readFileSync(path.join(RAIZ, ".env"), "utf8");
  for (const l of env.split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const TESTE = process.argv.includes("--teste");

const faltando = (TESTE
  ? ["DATABASE_URL"]
  : ["DATABASE_URL", "NETLIFY_SITE_ID", "NETLIFY_AUTH_TOKEN", "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"]
).filter((k) => !process.env[k]);
if (faltando.length) { console.error("Faltam variaveis:", faltando.join(", ")); process.exit(1); }

function conectar() {
  const u = new URL(process.env.DATABASE_URL);
  return new pg.Client({
    host: u.hostname,
    port: Number(u.port || 5432),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1) || undefined,
    ssl: { servername: u.hostname, rejectUnauthorized: false },
    connectionTimeoutMillis: 20000,
  });
}

async function existeNoS3(s3, key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const client = conectar();
  await client.connect();
  const { rows } = await client.query(
    `SELECT "blobKey", "contentType" FROM "Anexo" WHERE tipo = 'arquivo' AND "blobKey" IS NOT NULL`,
  );
  await client.end();
  console.log(`${rows.length} anexo(s) com arquivo no banco.`);
  if (TESTE) return;

  const netlify = getStore({ name: "anexos", siteID: process.env.NETLIFY_SITE_ID, token: process.env.NETLIFY_AUTH_TOKEN });
  const s3 = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
  });

  let copiados = 0, pulados = 0, ausentes = 0, falhas = 0;
  for (const { blobKey, contentType } of rows) {
    try {
      if (await existeNoS3(s3, blobKey)) { pulados++; continue; }
      const dados = await netlify.get(blobKey, { type: "arrayBuffer" });
      if (!dados) { ausentes++; console.warn("nao encontrado no Netlify:", blobKey); continue; }
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET, Key: blobKey, Body: new Uint8Array(dados), ContentType: contentType || undefined,
      }));
      copiados++;
      if (copiados % 20 === 0) console.log(`... ${copiados} copiados`);
    } catch (e) {
      falhas++;
      console.error("falha em", blobKey, "-", e instanceof Error ? e.message : e);
    }
  }
  console.log(`Fim. Copiados: ${copiados} | ja estavam no R2: ${pulados} | nao achados no Netlify: ${ausentes} | falhas: ${falhas}`);
  if (falhas) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
