# Materiais de identidade da Plante

Coloque aqui os arquivos de marca. Tudo nesta pasta é servido pela URL
`/brand/<arquivo>` (ex.: `public/brand/logo.svg` → `https://seusite/brand/logo.svg`).

## Arquivos sugeridos (use estes nomes para facilitar o uso no sistema)

| Arquivo                | O que é                                          | Formato ideal        |
| ---------------------- | ------------------------------------------------ | -------------------- |
| `logo.svg`             | Logotipo completo (símbolo + "Plante")           | SVG (ou PNG fundo transparente) |
| `logo-mark.svg`        | Só o símbolo (a lâmpada/broto), p/ ícones e PDFs | SVG                  |
| `logo-branco.svg`      | Versão do logo em branco (p/ fundo escuro)       | SVG/PNG              |
| `og-image.png`         | Imagem de compartilhamento (link em redes)       | PNG 1200×630         |

## Favicon (ícone da aba do navegador)

O favicon **não** vai aqui — no Next.js (App Router) ele fica em
`src/app/favicon.ico` (ou `icon.png` / `apple-icon.png` em `src/app/`).
Basta colocar o arquivo lá que o Next usa automaticamente.

## Importante

O logo que aparece hoje no sistema é um **SVG desenhado no código**
(`src/components/brand/logo.tsx`), não um arquivo de imagem. Depois de colocar
os arquivos reais aqui, é preciso **apontar o componente para eles** — peça ao
Claude Code para "usar o logo de public/brand/logo.svg" que ele troca.

## Cores e fontes

Já estão no sistema (não precisam virar arquivo):
- **Cores** da marca: `src/app/globals.css` (tokens `--brand-yellow`, `--ink-900`, etc.)
- **Fontes**: Space Grotesk + Inter, carregadas do Google Fonts em `src/app/layout.tsx`.

Se a Plante tiver uma fonte própria (arquivo `.woff2`), ela pode entrar em
`public/brand/fonts/` e ser registrada no `layout.tsx`.
