# Assistente de IA (ata e briefing)

O sistema pode gerar **rascunhos** de ata de reunião e de briefing de job usando a API
da Anthropic (Claude). É opcional e vem **desligado** até a chave ser configurada.

## Como ligar

1. Crie uma chave em https://console.anthropic.com/ (API Keys).
2. No Netlify do projeto: **Site settings → Environment variables** e adicione:
   - `ANTHROPIC_API_KEY` = a chave (`sk-ant-...`).
   - (opcional) `ANTHROPIC_MODEL` = modelo a usar. Padrão: `claude-haiku-4-5` (rápido e barato).
     Para textos mais elaborados, use `claude-sonnet-4-6`.
3. Refaça o deploy (ou aguarde o próximo). Pronto — os botões "Gerar com IA" passam a funcionar.

Sem a chave, os botões mostram "Assistente de IA não está configurado".

## Onde aparece

- **Reuniões → abrir uma ata → "Gerar ata com IA"**: organiza pauta/decisões/próximos
  passos numa ata estruturada.
- **Jobs → abrir um job → Briefing → "Gerar briefing com IA"**: organiza/expande o
  briefing a partir do título, tipo e legenda.

## Regras importantes

- A IA gera **sugestão**, não texto oficial. O resultado aparece numa área separada com
  aviso e botão "Copiar" — **revise sempre** antes de usar; nada é salvo automaticamente.
- A IA usa **apenas** as informações já cadastradas no registro (não inventa dados).
- Custo: cada geração consome tokens da sua conta Anthropic (centavos por geração com o
  modelo Haiku). Você controla pelo painel da Anthropic.
