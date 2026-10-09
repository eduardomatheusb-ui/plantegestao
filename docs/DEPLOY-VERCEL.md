# Deploy na Vercel (plano B, saída do Netlify)

O código desta branch roda nos dois lugares. Sem as variáveis `S3_*`, os anexos
continuam no Netlify Blobs; com elas, vão para o Cloudflare R2. As rotinas
agendadas existem em dobro: `netlify/functions` (Netlify) e `vercel.json` +
`/api/cron/<rotina>` (Vercel), com a mesma lógica em `src/lib/rotinas`.

## 1. Cloudflare R2 (anexos)

1. Em dash.cloudflare.com, **R2 Object Storage → Create bucket**, nome `trem-anexos`. Deixe privado.
2. **R2 → Manage API tokens → Create API token**, permissão *Object Read & Write* só nesse bucket.
3. Anote: Access Key ID, Secret Access Key e o endpoint `https://<account_id>.r2.cloudflarestorage.com`.

## 2. Vercel

1. vercel.com → **Add New → Project** → importar `eduardomatheusb-ui/plantegestao`, branch `migracao-vercel`.
   Plano: **Pro** (o Hobby não permite uso comercial).
2. **Settings → Environment Variables** (Production):

| Variável | Valor |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | as mesmas do Netlify (Neon) |
| `AUTH_SECRET` | o mesmo do Netlify, para ninguém ser deslogado |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` | as mesmas |
| `RESEND_API_KEY`, `EMAIL_FROM` | as mesmas |
| `AGENTE_API_URL`, `AGENTE_API_KEY` | as mesmas |
| `TREM_WEBHOOK_SECRET`, `TREM_CRON_SECRET`, `TREM_REVISAO_SECRET` | as mesmas |
| `APP_BASE_URL` | `https://trem.agenciaplante.com.br` |
| `CRON_SECRET` | texto aleatório longo, novo (a Vercel usa nos crons) |
| `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | do passo 1 |

3. Deploy. Testar pelo endereço `*.vercel.app` antes de mudar o domínio.

## 3. Anexos antigos

Só funciona se o Netlify liberar acesso à conta. Com `NETLIFY_SITE_ID`,
`NETLIFY_AUTH_TOKEN` e as `S3_*` no `.env` local:

```bash
node scripts/migrar-anexos.mjs --teste
node scripts/migrar-anexos.mjs
```

Pode rodar de novo sem duplicar: o que já está no R2 é pulado.

## 4. Domínio

Vercel → **Settings → Domains → Add** `trem.agenciaplante.com.br`. No DNS do
domínio, trocar o CNAME de `trem` para o valor que a Vercel mostrar.

## 5. Conferir

- Login, abrir um job com anexo, enviar um anexo novo.
- Vercel → **Settings → Cron Jobs**: as 4 rotinas listadas. Dá para disparar cada uma por lá.
