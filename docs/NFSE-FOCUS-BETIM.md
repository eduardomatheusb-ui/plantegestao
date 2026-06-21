# Ativar a emissão de NFS-e (Betim/MG) via Focus NFe

A emissão de Nota Fiscal de Serviço já está **construída no TREM** (botão "Emitir NFS-e"
na OS e no lançamento de receita). Falta só **conectar a conta da Focus NFe** — o que
depende de você. Este guia é específico pra **Betim**.

## O que Betim exige (confirmado)
- **Login e senha da prefeitura** — **NÃO precisa de certificado digital**. 🎉
- Betim aderiu à **NFS-e Nacional** (padrão nacional, 2026). O TREM já está configurado
  pra esse padrão (endpoint `/v2/nfsen`).

## Passo a passo

### 1. Garantir o acesso na prefeitura de Betim
- A Plante precisa ter **inscrição municipal** ativa e um **login/senha** do sistema de
  NFS-e de Betim. Se a contabilidade já emite notas hoje, **essas credenciais já existem** —
  é só pegar com eles. Se não, solicita-se na prefeitura.

### 2. Criar a conta na Focus NFe
1. Acesse **https://focusnfe.com.br** e crie uma conta.
2. No painel, **cadastre a empresa** (CNPJ da Plante).
3. Em **NFS-e → configuração da empresa**, informe o **login e senha da prefeitura de
   Betim** (é assim que a Focus emite por você). Confirme que a cidade aparece como
   **NFS-e Nacional**.
4. Comece no **ambiente de Homologação** (teste — nota sem valor fiscal).
5. Copie o **token de Homologação** da conta.

### 3. Configurar no Netlify
Em **Site configuration → Environment variables**, adicione:

| Variável | Valor |
|---|---|
| `FOCUS_NFE_TOKEN` | o token da Focus (homologação primeiro) |
| `FOCUS_NFE_AMBIENTE` | `homologacao` (depois troca pra `producao`) |
| `FOCUS_NFE_MODELO` | `nacional` *(já é o padrão; só pra deixar explícito)* |

Depois: **Deploys → Trigger deploy** (variável só vale após novo deploy).

### 4. Preencher os dados fiscais no TREM
Em **Administração → Dados da empresa**, confira/preencha (peça os códigos à contabilidade):
- **Inscrição municipal**
- **Código IBGE do município** (Betim = `3106705`)
- **Alíquota de ISS** (%)
- **Código de tributação nacional do ISS** (campo "item da lista de serviço" / "código
  de serviço") — no padrão nacional é um código próprio; a contabilidade informa.
- **Optante pelo Simples Nacional** (marque se for o caso)

### 5. Testar em homologação
1. Abra uma **OS** (ou um lançamento de receita) com um cliente que tenha **CNPJ/CPF**.
2. Clique em **Emitir NFS-e**.
3. Acompanhe o status (Processando → Autorizada). Se der erro, a mensagem da Focus
   aparece no painel — geralmente é algum **código fiscal** a ajustar (a gente acerta).
4. Validado em homologação → troque `FOCUS_NFE_AMBIENTE` para `producao` + redeploy, e a
   partir daí as notas têm **valor fiscal**.

## Resumo
```
FOCUS_NFE_TOKEN     = (token da Focus)
FOCUS_NFE_AMBIENTE  = homologacao   → depois: producao
FOCUS_NFE_MODELO    = nacional
```
+ login/senha de Betim cadastrados **na Focus** + dados fiscais preenchidos no TREM.

> Sem certificado digital. O TREM já fala o "idioma" do padrão nacional; o ajuste fino
> dos códigos fiscais é feito junto na homologação.
