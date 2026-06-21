# Ativar o e-mail das notificações (Resend)

O TREM já dispara e-mail em **toda notificação** (atribuição, comentário, menção `@`,
mudança de status, mensagem direta no chat, prazos). Mas isso fica **desligado** até você
conectar um serviço de envio. Usamos o **Resend** (tem plano grátis generoso).

> Enquanto não estiver configurado, nada quebra: o sistema funciona normal, só não sai
> e-mail (as notificações continuam no sino e no chat).

São **3 variáveis** no final: `RESEND_API_KEY`, `EMAIL_FROM` e (opcional) `APP_BASE_URL`.

---

## Passo 1 — Criar a conta no Resend

1. Acesse **https://resend.com** e crie uma conta (pode entrar com o Google da agência).
2. Confirme o e-mail de cadastro.

## Passo 2 — Verificar o domínio `agenciaplante.com.br`

Isso é o que permite enviar e-mail **com o remetente de vocês** (e não cair em spam).

1. No painel do Resend, vá em **Domains → Add Domain**.
2. Digite `agenciaplante.com.br` e confirme.
3. O Resend vai mostrar uma lista de **registros DNS** (alguns `TXT`, um `MX` e
   `CNAME` de DKIM). **Copie cada um.**
4. Abra o **Cloudflare** (onde fica o DNS de vocês) → o domínio `agenciaplante.com.br`
   → **DNS → Records → Add record**.
5. Para cada registro que o Resend pediu, crie o mesmo no Cloudflare:
   - **Type / Name / Content** exatamente como o Resend mostrou.
   - Nos registros de DKIM/SPF (CNAME e TXT), deixe a **nuvem cinza** (DNS only) — não
     proxiar.
6. Volte ao Resend e clique em **Verify**. Pode levar de alguns minutos até algumas horas
   (geralmente rápido). Quando ficar **Verified**, está pronto.

## Passo 3 — Gerar a API Key

1. No Resend, vá em **API Keys → Create API Key**.
2. Nome: `TREM`. Permissão: **Sending access** (envio).
3. **Copie a chave** (`re_...`) — ela só aparece uma vez.

## Passo 4 — Configurar no Netlify

1. Abra o site no **Netlify → Site configuration → Environment variables**.
2. Adicione:

   | Variável | Valor |
   |---|---|
   | `RESEND_API_KEY` | a chave `re_...` do passo 3 |
   | `EMAIL_FROM` | `TREM <nao-responder@agenciaplante.com.br>` |
   | `APP_BASE_URL` | `https://trem.agenciaplante.com.br` *(opcional — usado nos links do e-mail)* |

   > O `EMAIL_FROM` precisa usar um endereço **no domínio verificado** no passo 2.
   > Pode ser `nao-responder@`, `trem@`, `avisos@` — o que preferir.

3. **Importante:** toda mudança de variável no Netlify só vale **depois de um novo deploy**.
   Vá em **Deploys → Trigger deploy → Deploy site** (ou faça qualquer push).

## Passo 5 — Testar

1. Entre no TREM, abra um job/projeto e escreva um comentário **mencionando** outra
   pessoa com `@`.
2. Essa pessoa deve receber o e-mail (cheque também a aba *spam* na primeira vez).
3. Se não chegar: confira no Resend em **Logs** se a tentativa aparece — lá mostra o erro
   (domínio não verificado, remetente inválido, etc.).

---

## Resumo rápido

```
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM     = TREM <nao-responder@agenciaplante.com.br>
APP_BASE_URL   = https://trem.agenciaplante.com.br   (opcional)
```

Setou as 3 + redeploy = e-mail no ar. 🎉
