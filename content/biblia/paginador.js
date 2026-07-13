/**
 * Paginador A4 — substitui a folha contínua do <doc-page> por FOLHAS A4 reais na tela.
 *
 * Como funciona: espera as fontes carregarem, mede cada bloco de conteúdo e vai
 * distribuindo os blocos em folhas de 210×297mm (padding 15mm). Quando um bloco não
 * cabe na folha atual, ele abre a próxima. Blocos com `break-after: page` (ex.: a capa)
 * encerram a folha. O rodapé original repete em toda folha, com "pág. X/Y".
 * Na impressão, cada folha vira uma página A4 exata (@page size A4, margin 0).
 */
(() => {
  const CSS = `
    html, body { margin: 0; padding: 0; background: #ece8dd; }
    .paginas { display: flex; flex-direction: column; align-items: center; gap: 24px; padding: 32px 12px; }
    .folha {
      width: 210mm; min-height: 297mm; box-sizing: border-box; padding: 15mm;
      background: #fff; box-shadow: 0 2px 14px rgba(20, 20, 19, 0.12); border-radius: 2px;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .folha-conteudo { flex: 1 1 auto; min-height: 0; }
    .folha-rodape { margin-top: auto; padding-top: 5mm; }
    @page { size: A4; margin: 0; }
    @media print {
      html, body { background: #fff !important; }
      .paginas { display: block; padding: 0; }
      .folha { margin: 0; box-shadow: none; border-radius: 0; break-after: page; height: 297mm; }
      .folha:last-child { break-after: auto; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  function paginar() {
    const docPage = document.querySelector("doc-page");
    if (!docPage) return;

    // Rodapé original (repete em toda folha).
    const rodapeTpl = docPage.querySelector(':scope > [slot="footer"]');
    if (rodapeTpl) rodapeTpl.remove();

    const blocos = Array.from(docPage.children);

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.className = "paginas";
    document.body.appendChild(container);

    // Altura útil de conteúdo: 297mm − 30mm de padding − ~14mm reservados ao rodapé.
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:100mm;width:0";
    document.body.appendChild(probe);
    const mmPx = probe.offsetHeight / 100;
    probe.remove();
    const MAX = (297 - 30 - 14) * mmPx;

    const folhas = [];
    let conteudoAtual = null;

    const novaFolha = () => {
      const folha = document.createElement("div");
      folha.className = "folha";
      const conteudo = document.createElement("div");
      conteudo.className = "folha-conteudo";
      folha.appendChild(conteudo);
      container.appendChild(folha);
      folhas.push(folha);
      conteudoAtual = conteudo;
    };

    novaFolha();
    for (const bloco of blocos) {
      conteudoAtual.appendChild(bloco);
      // Estourou a folha e não é o único bloco? Vai pra próxima.
      if (conteudoAtual.children.length > 1 && conteudoAtual.scrollHeight > MAX) {
        novaFolha();
        conteudoAtual.appendChild(bloco);
      }
      // Quebra forçada (capa, fins de capítulo).
      const ba = getComputedStyle(bloco).breakAfter;
      if (ba === "page" || ba === "always") novaFolha();
    }
    // Remove folha final vazia (ex.: quando o último bloco força quebra).
    const ultima = folhas[folhas.length - 1];
    if (ultima && ultima.querySelector(".folha-conteudo").children.length === 0) {
      ultima.remove();
      folhas.pop();
    }

    // Rodapé com numeração em toda folha.
    if (rodapeTpl) {
      folhas.forEach((folha, i) => {
        const rodape = document.createElement("div");
        rodape.className = "folha-rodape";
        const clone = rodapeTpl.cloneNode(true);
        clone.removeAttribute("slot");
        const ultimoSpan = clone.querySelector(":scope > span:last-child");
        if (ultimoSpan) ultimoSpan.textContent += ` · pág. ${i + 1}/${folhas.length}`;
        rodape.appendChild(clone);
        folha.appendChild(rodape);
      });
    }

    docPage.remove();
    document.documentElement.style.visibility = "visible";
  }

  const iniciar = () => {
    // Evita medir com fonte errada (folha quebraria no lugar errado). Timeout de segurança
    // de 3s caso fonts.ready trave. setTimeout (não rAF): rAF não dispara em aba oculta —
    // quem abre o manual em segundo plano encontraria a página em branco.
    const fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const teto = new Promise((r) => setTimeout(r, 3000));
    Promise.race([fontes, teto]).then(() => setTimeout(paginar, 0));
  };

  // Esconde tudo até paginar (sem flash de conteúdo contínuo).
  document.documentElement.style.visibility = "hidden";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
