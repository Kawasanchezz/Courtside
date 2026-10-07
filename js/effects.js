/* =====================================================================
   effects.js — acabamento "Awwwards" (standalone, roda em qualquer página)
   cursor customizado · botões magnéticos · barra de progresso · transição
   ===================================================================== */
(() => {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- barra de progresso do scroll ---------- */
  const bar = document.createElement('div');
  bar.className = 'fx-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const docEl = document.documentElement;
  let maxScroll = 0;
  function measureMax() { maxScroll = docEl.scrollHeight - docEl.clientHeight; updateProgress(); }
  function updateProgress() {
    const y = docEl.scrollTop || window.scrollY || 0;
    bar.style.transform = `scaleX(${maxScroll > 0 ? y / maxScroll : 0})`;
  }
  addEventListener('scroll', updateProgress, { passive: true });
  addEventListener('resize', measureMax);
  addEventListener('load', measureMax);
  measureMax();

  /* ---------- cortina de transição entre páginas ---------- */
  const curtain = document.createElement('div');
  curtain.className = 'fx-curtain';
  curtain.setAttribute('aria-hidden', 'true');
  const curtainMark = document.createElement('span');
  curtainMark.className = 'fx-curtain-mark';
  curtainMark.textContent = 'Courtside';
  curtain.appendChild(curtainMark);
  document.body.appendChild(curtain);

  let navigating = false;
  function navigate(href) {
    if (navigating) return;
    // só navega dentro do próprio site (bloqueia javascript:, data: e origens externas)
    let dest;
    try { dest = new URL(href, location.href); } catch { return; }
    if (dest.origin !== location.origin) return;
    navigating = true;
    curtain.classList.add('in');
    setTimeout(() => { location.href = href; }, reduce ? 0 : 620);
  }
  addEventListener('pageshow', () => { navigating = false; curtain.classList.remove('in'); });

  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href === '#' || a.target === '_blank' || a.hasAttribute('download')) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // "voltar": se há histórico, usa history.back() (restaura a posição de onde veio)
    if (a.hasAttribute('data-back') && history.length > 1) {
      e.preventDefault();
      if (navigating) return;
      navigating = true;
      curtain.classList.add('in');
      setTimeout(() => history.back(), reduce ? 0 : 620);
      return;
    }
    if (/^(mailto:|tel:|https?:)/i.test(href)) return;      // externo/mailto: navegação normal
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // âncora na mesma página → scroll suave
    e.preventDefault();
    navigate(url.href);
  });

  /* ---------- botões magnéticos: só desktop com mouse (cursor nativo mantido) ---------- */
  if (!fine || reduce) return;
  const magnets = document.querySelectorAll('.pill:not(#footer-book), .icon-btn, .arrow-btn, .header-book, .sub-back');
  magnets.forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.3}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => {
      el.style.transition = 'transform 0.4s cubic-bezier(0.16,1,0.3,1)';
      el.style.transform = 'translate(0, 0)';
      setTimeout(() => { el.style.transition = ''; }, 400);
    });
  });
})();
