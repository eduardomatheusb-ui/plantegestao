# Deploy no Netlify

Plante Gestão (Next.js 15 + Prisma + PostgreSQL/Neon). Infra já preparada:
`netlify.toml`, `directUrl` no Prisma, `binaryTargets` para o runtime serverless.

## 1. Banco (Neon) — pegar as duas conexões

No painel do Neon, em **Connection Details**, copie:

- **Pooled connection** (host com `-pooler`) → vai em `DATABASE_URL`
- **Direct connection** (host sem `-pooler`) → vai em `DIRECT_URL`

Ambas terminam com `?sslmode=require`. O schema usa a pooled no runtime (serverless) e
a direta nas migrations.

## 2. Subir o código para um repositório Git

O projeto já é um repositório git com o primeiro commit. Crie um repo vazio no GitHub
(ex.: `plante-gestao`, **privado**) e rode:

```bash
git remote add origin https://github.com/SEU_USUARIO/plante-gestao.git
git branch -M main
git push -u origin main
```

> Alternativa sem GitHub: instale o Netlify CLI (`npm i -g netlify-cli`),
> rode `netlify deploy --build` na pasta do projeto e siga o login.

## 3. Criar o site no Netlify

1. Em https://app.netlify.com → **Add new site → Import an existing project** → escolha
   o repositório.
2. Netlify detecta o Next.js automaticamente. O `netlify.toml` já define o build.
3. Em **Site settings → Environment variables**, adicione:

| Variável        | Valor                                                        |
| --------------- | ------------------------------------------------------------ |
| `DATABASE_URL`  | conexão **pooled** do Neon (`...-pooler...?sslmode=require`)  |
| `DIRECT_URL`    | conexão **direta** do Neon (`...?sslmode=require`)           |
| `AUTH_SECRET`   | um segredo forte (gere com `npx auth secret`)                |

4. **Deploy**. O build roda `prisma migrate deploy` (aplica migrations) + `next build`.

## 4. Primeiro acesso

O banco já tem o seed (3 usuários, senha `plante123`). Faça login com
`eduardo@plante.com.br`. **Troque as senhas** depois (ou rode um seed novo com senhas reais).

## Observações
- O `AUTH_SECRET` de produção deve ser diferente do de desenvolvimento.
- Se aparecer erro de engine do Prisma em runtime, confirme `binaryTargets` no
  `schema.prisma` e a env `PRISMA_CLI_BINARY_TARGETS` no `netlify.toml`.
- Após publicar, considere **resetar a senha do banco** no Neon (a connection string já
  foi compartilhada em chat durante o desenvolvimento).
