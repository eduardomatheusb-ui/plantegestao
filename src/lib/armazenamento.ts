// Armazenamento de anexos, independente de hospedagem.
//
// Se as variáveis do R2 (S3_*) existirem, usa o Cloudflare R2 (ou qualquer S3).
// Senão, cai no Netlify Blobs, que é o que o TREM usava até a migração.
// As chaves são as mesmas nos dois lados (`job/<id>/<uuid>` etc.), então os
// arquivos antigos podem ser copiados sem mexer no banco (scripts/migrar-anexos.mjs).

const STORE = "anexos";

// trim: espaço ou quebra de linha colados junto com a chave invalidam a assinatura.
const env = (k: string) => process.env[k]?.trim() || undefined;
const bucket = () => env("S3_BUCKET");

function usaS3() {
  return !!(env("S3_BUCKET") && env("S3_ENDPOINT") && env("S3_ACCESS_KEY_ID") && env("S3_SECRET_ACCESS_KEY"));
}

let clienteS3: import("@aws-sdk/client-s3").S3Client | null = null;
async function s3() {
  const { S3Client } = await import("@aws-sdk/client-s3");
  clienteS3 ??= new S3Client({
    region: env("S3_REGION") || "auto",
    endpoint: env("S3_ENDPOINT"),
    // O R2 não aceita os checksums que o SDK v3 passou a mandar por padrão.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env("S3_ACCESS_KEY_ID")!,
      secretAccessKey: env("S3_SECRET_ACCESS_KEY")!,
    },
  });
  return clienteS3;
}

export async function salvarArquivo(key: string, dados: ArrayBuffer, contentType?: string) {
  if (usaS3()) {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await (await s3()).send(
      new PutObjectCommand({ Bucket: bucket(), Key: key, Body: new Uint8Array(dados), ContentType: contentType }),
    );
    return;
  }
  const { getStore } = await import("@netlify/blobs");
  await getStore(STORE).set(key, dados);
}

/** Devolve o conteúdo, ou null se o arquivo não existir. */
export async function lerArquivo(key: string): Promise<ArrayBuffer | null> {
  if (usaS3()) {
    const { GetObjectCommand, NoSuchKey } = await import("@aws-sdk/client-s3");
    try {
      const r = await (await s3()).send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
      if (!r.Body) return null;
      const bytes = await r.Body.transformToByteArray();
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    } catch (e) {
      if (e instanceof NoSuchKey) return null;
      throw e;
    }
  }
  const { getStore } = await import("@netlify/blobs");
  return getStore(STORE).get(key, { type: "arrayBuffer" });
}

export async function apagarArquivo(key: string) {
  if (usaS3()) {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await (await s3()).send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
    return;
  }
  const { getStore } = await import("@netlify/blobs");
  await getStore(STORE).delete(key);
}
