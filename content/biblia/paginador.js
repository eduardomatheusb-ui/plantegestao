/**
 * Paginador A4 — substitui a folha contínua do <doc-page> por FOLHAS A4 reais na tela.
 *
 * Distribui o conteúdo em folhas de 210×297mm (padding 15mm). Blocos maiores que uma
 * página (capítulos inteiros em <section>) são DIVIDIDOS por dentro: o invólucro continua
 * numa folha nova (clone raso, mantendo estilos) e os filhos seguem fluindo — como o motor
 * de impressão faria. Respeita break-before/after: page (capa, fins de capítulo) e evita
 * título órfão no pé da página. O rodapé original repete em toda folha com "pág. X/Y".
 * Na impressão cada folha vira uma página A4 (@page A4, margin 0).
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
      /* min-height (não height fixa) + overflow visível: página rara maior que A4
         derrama na folha seguinte em vez de ser cortada. */
      .folha { margin: 0; box-shadow: none; border-radius: 0; break-after: page; overflow: visible; }
      .folha:last-child { break-after: auto; }
      * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  // Elementos que não dividimos por dentro (se estourarem sozinhos, a folha cresce).
  const ATOMICO = new Set(["TABLE", "THEAD", "TBODY", "TR", "H1", "H2", "H3", "H4", "H5", "H6", "FIGURE", "IMG", "SVG", "PRE", "P", "BLOCKQUOTE"]);
  const TITULO = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

  function paginar() {
    const docPage = document.querySelector("doc-page");
    if (!docPage) return;

    const rodapeTpl = docPage.querySelector(':scope > [slot="footer"]');
    if (rodapeTpl) rodapeTpl.remove();
    const blocos = Array.from(docPage.children);

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const container = document.createElement("div");
    container.className = "paginas";
    document.body.appendChild(container);

    // Altura útil: 297mm − 30mm padding − ~14mm de rodapé.
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:100mm;width:0";
    document.body.appendChild(probe);
    const mmPx = probe.offsetHeight / 100;
    probe.remove();
    const MAX = (297 - 30 - 14) * mmPx;

    const folhas = [];
    let conteudo = null;

    const novaFolha = () => {
      const folha = document.createElement("div");
      folha.className = "folha";
      const c = document.createElement("div");
      c.className = "folha-conteudo";
      folha.appendChild(c);
      container.appendChild(folha);
      folhas.push(folha);
      conteudo = c;
    };
    const cabe = () => conteudo.scrollHeight <= MAX;
    const folhaVazia = () => conteudo.childNodes.length === 0;

    /** Move `no` para uma nova folha; se o anterior era um título, leva junto (sem órfãos). */
    const continuarEmNovaFolha = (no, paiClonavel) => {
      const pai = no.parentNode;
      let arrastarTitulo = null;
      const anterior = no.previousElementSibling;
      if (anterior && TITULO.has(anterior.tagName) && anterior !== pai.firstElementChild) arrastarTitulo = anterior;

      novaFolha();
      let destino = conteudo;
      if (paiClonavel) {
        const cont = paiClonavel.cloneNode(false); // invólucro com os mesmos estilos, vazio
        conteudo.appendChild(cont);
        destino = cont;
      }
      if (arrastarTitulo) destino.appendChild(arrastarTitulo);
      destino.appendChild(no);
      return destino;
    };

    /** Distribui os filhos de `el` (que sozinho estourou a folha) pelo fluxo de páginas. */
    const dividirPorDentro = (el) => {
      if (ATOMICO.has(el.tagName) || el.childElementCount === 0) return; // deixa a folha crescer
      const fila = Array.from(el.childNodes);
      for (const no of fila) el.removeChild(no);
      let atual = el;
      for (const no of fila) {
        atual.appendChild(no);
        if (!cabe()) {
          const soEle = atual.childNodes.length === 1 || (atual.childNodes.length === 2 && TITULO.has(atual.firstElementChild?.tagName ?? ""));
          if (!soEle) {
            atual = continuarEmNovaFolha(no, el);
          } else if (no.nodeType === 1) {
            dividirPorDentro(no); // único filho e ainda estoura → desce um nível
          }
        }
      }
    };

    novaFolha();
    for (const bloco of blocos) {
      const st = getComputedStyle(bloco);
      if ((st.breakBefore === "page" || st.breakBefore === "always") && !folhaVazia()) novaFolha();

      conteudo.appendChild(bloco);
      if (!cabe()) {
        if (conteudo.children.length > 1) {
          // Não é o único da folha: recomeça na próxima.
          const anterior = bloco.previousElementSibling;
          novaFolha();
          if (anterior && TITULO.has(anterior.tagName)) conteudo.appendChild(anterior);
          conteudo.appendChild(bloco);
        }
        if (!cabe()) dividirPorDentro(bloco);
      }
      const sa = getComputedStyle(bloco).breakAfter;
      if (sa === "page" || sa === "always") novaFolha();
    }
    // Remove folha final vazia.
    const ultima = folhas[folhas.length - 1];
    if (ultima && ultima.querySelector(".folha-conteudo").childNodes.length === 0) {
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
    // Espera as fontes (senão a medida quebra a folha no lugar errado), com teto de 3s.
    // setTimeout (não rAF): rAF não dispara em aba oculta — o manual aberto em segundo
    // plano ficaria em branco.
    const fontes = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const teto = new Promise((r) => setTimeout(r, 3000));
    Promise.race([fontes, teto]).then(() => setTimeout(paginar, 0));
  };

  document.documentElement.style.visibility = "hidden";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
