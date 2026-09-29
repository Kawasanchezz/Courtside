/* Lenis é carregado como script clássico antes deste arquivo (window.Lenis). */

/* =====================================================================
   1. Constantes e helpers
   ===================================================================== */
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const ASSET = 'assent';

const EXPO  = 'cubic-bezier(0.16, 1, 0.3, 1)';   // easeOutExpo
const QUART = 'cubic-bezier(0.25, 1, 0.5, 1)';   // easeOutQuart
const INOUT = 'cubic-bezier(0.65, 0, 0.35, 1)';  // easeInOutCubic

const REDUCED_MOTION = matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = () => innerWidth > 768;

// só rola pro topo em carregamento novo; numa volta (back/forward) mantém a posição
const navType = (performance.getEntriesByType('navigation')[0] || {}).type;
if (navType !== 'back_forward') window.scrollTo(0, 0);

/* =====================================================================
   2. Grid rem adaptativo — escala acima de 1920px (abaixo, media queries)
   ===================================================================== */
const FONT_BASE = 16;
const BASE_W = 1920;
const COEF = 0.6666;

function fitRootFont() {
  const reduction = ((BASE_W - innerWidth) / BASE_W) * 100 * COEF;
  const size = FONT_BASE - (FONT_BASE * reduction) / 100;
  if (size > FONT_BASE) document.documentElement.style.fontSize = size + 'px';
  else document.documentElement.style.removeProperty('font-size');
}
fitRootFont();
addEventListener('resize', fitRootFont);

/* =====================================================================
   3. Lenis + trava de scroll
   ===================================================================== */
const lenis = new Lenis({ smoothWheel: true });
let lockCount = 0;

function lockScroll() {
  lockCount++;
  lenis.stop();
  document.documentElement.classList.add('locked');
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    lenis.start();
    document.documentElement.classList.remove('locked');
  }
}

/* =====================================================================
   4. Motor de springs — modelo { tension, friction } do react-spring
   ===================================================================== */
const REST = { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 };
const activeSprings = new Set();

function stateOf(el) {
  return el._spring || (el._spring = { el, props: {} });
}

function render(state) {
  const get = key => {
    const p = state.props[key];
    return p && p.value !== undefined ? p.value : REST[key];
  };
  state.el.style.transform =
    `translate3d(${get('x')}px, ${get('y')}px, 0) scale(${get('scale')}) rotate(${get('rotate')}deg)`;
  if (state.props.opacity) state.el.style.opacity = get('opacity');
}

/** Aplica um estado imediatamente, sem animar. */
function springSet(el, props) {
  const state = stateOf(el);
  for (const key in props) {
    const p = state.props[key] || (state.props[key] = {});
    p.value = props[key];
    p.target = props[key];
    p.velocity = 0;
  }
  render(state);
}

/** Anima até o alvo com a config de mola informada. */
function springTo(el, props, { tension, friction }) {
  const state = stateOf(el);
  for (const key in props) {
    const p = state.props[key] || (state.props[key] = {});
    if (p.value === undefined) {
      p.value = REST[key];
      p.velocity = 0;
    }
    p.target = props[key];
    p.tension = tension;
    p.friction = friction;
  }
  activeSprings.add(state);
}

function stepSprings(dt) {
  for (const state of activeSprings) {
    let settled = true;

    for (const key in state.props) {
      const p = state.props[key];
      if (p.target === undefined || p.tension === undefined) continue;

      const accel = -p.tension * (p.value - p.target) - p.friction * p.velocity;
      p.velocity += accel * dt;
      p.value += p.velocity * dt;

      const eps = key === 'opacity' || key === 'scale' ? 0.001 : 0.05;
      if (Math.abs(p.value - p.target) < eps && Math.abs(p.velocity) < eps * 20) {
        p.value = p.target;
        p.velocity = 0;
      } else {
        settled = false;
      }
    }

    render(state);
    if (settled) activeSprings.delete(state);
  }
}

/* =====================================================================
   5. Parallax por progresso de scroll (topo=base → 0, base=topo → 1)
   ===================================================================== */
const parallaxItems = [];

function addParallax(section, el, apply) {
  parallaxItems.push({ section, el, apply });
}

function stepParallax() {
  const vh = innerHeight;
  let curSection = null, curRect = null;
  for (const item of parallaxItems) {
    // itens da mesma seção reaproveitam o mesmo rect (1 leitura por seção, não por item)
    if (item.section !== curSection) { curSection = item.section; curRect = curSection.getBoundingClientRect(); }
    const progress = Math.min(1, Math.max(0, (vh - curRect.top) / (vh + curRect.height)));
    item.apply(item.el, progress);
  }
}

/* =====================================================================
   6. Loop rAF único: Lenis + springs + parallax
   ===================================================================== */
let lastTime = performance.now();
let lastScroll = -1;
let introFrame = null; // definido na seção 23 (intro); chamado quando o scroll muda

function raf(time) {
  lenis.raf(time);
  const dt = Math.min((time - lastTime) / 1000, 0.064) || 0.016;
  lastTime = time;
  stepSprings(dt);
  // parallax e o hero dependem só do scroll: rodam apenas quando ele muda (poupa CPU parado)
  const scroll = lenis.scroll || window.scrollY || 0;
  if (scroll !== lastScroll) {
    lastScroll = scroll;
    stepParallax();
    if (introFrame) introFrame();
  }
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// no resize, força recalcular parallax/hero no próximo quadro (posições mudaram)
addEventListener('resize', () => { lastScroll = -1; });

/* =====================================================================
   7. Reveal ao entrar na viewport (dispara uma única vez)
   ===================================================================== */
const inviewCallbacks = new Map();

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const cb = inviewCallbacks.get(entry.target);
    if (!cb) continue;
    inviewCallbacks.delete(entry.target);
    observer.unobserve(entry.target);
    cb();
  }
}, { threshold: 0.15 });

function onInview(el, cb) {
  inviewCallbacks.set(el, cb);
  observer.observe(el);
}

function inview(el, from, to, config, delayIn = 0) {
  springSet(el, from);
  onInview(el, () => setTimeout(() => springTo(el, to, config), delayIn));
}

/* =====================================================================
   8. Hover spring (desativado em telas <= 768px)
   ===================================================================== */
function hover(trigger, target, from, to, config) {
  trigger.addEventListener('pointerenter', () => canHover() && springTo(target, to, config));
  trigger.addEventListener('pointerleave', () => canHover() && springTo(target, from, config));
}

/* =====================================================================
   9. Reveals de texto (clip-mask por palavra/linha e fade por palavra)
   ===================================================================== */
function buildSegments(el, mode) {
  const segments = [];

  if (mode === 'lines') {
    $$('.ln', el).forEach(line => {
      const text = line.textContent;
      line.textContent = '';
      line.classList.add('clip', 'line-clip');
      const seg = document.createElement('span');
      seg.className = 'seg';
      seg.textContent = text;
      line.appendChild(seg);
      segments.push(seg);
    });
    return segments;
  }

  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';

  words.forEach((word, i) => {
    if (i) el.appendChild(document.createTextNode(' '));
    const seg = document.createElement('span');
    seg.className = 'seg';
    seg.textContent = word;

    if (mode === 'words') {
      const clip = document.createElement('span');
      clip.className = 'clip';
      clip.appendChild(seg);
      el.appendChild(clip);
    } else {
      el.appendChild(seg); // 'wordfade' — sem máscara, só fade + rise
    }
    segments.push(seg);
  });

  return segments;
}

function hideSegments(segments, y) {
  segments.forEach(seg => {
    seg.style.transition = 'none';
    seg.style.transform = `translateY(${y})`;
    seg.style.opacity = '0';
  });
}

function playSegments(segments, { base = 0, stagger = 0, duration = 950, ease = EXPO }) {
  if (segments.length) segments[0].getBoundingClientRect(); // força o estado oculto
  requestAnimationFrame(() => {
    segments.forEach((seg, i) => {
      const delay = base + i * stagger;
      seg.style.transition =
        `transform ${duration}ms ${ease} ${delay}ms, opacity ${duration}ms ${ease} ${delay}ms`;
      seg.style.transform = 'translateY(0)';
      seg.style.opacity = '1';
    });
  });
}

/** Prepara o elemento e devolve { play } para (re)disparar o reveal. */
function textReveal(el, { mode = 'words', y = '115%', ...timing }) {
  const segments = buildSegments(el, mode);
  hideSegments(segments, y);
  return {
    play() {
      hideSegments(segments, y);
      playSegments(segments, timing);
    }
  };
}

/** textReveal que dispara sozinho ao entrar na viewport. */
function textRevealInview(el, options) {
  const reveal = textReveal(el, options);
  onInview(el, () => reveal.play());
  return reveal;
}

/* =====================================================================
   10. Dados
   ===================================================================== */
const COLLECTIONS = [
  { img: `${ASSET}/2.jpg`, brand: 'Courtside Pro', title: 'Featured Gear', cta: 'Shop the kit',   alt: 'Player driving a backhand on a hard court' },
  { img: `${ASSET}/3.jpg`, brand: 'Court Series', title: 'Summer Drop',   cta: 'View the line',  alt: 'Player stretching for a forehand on clay' },
  { img: `${ASSET}/5.jpg`, brand: 'Academy Kit',  title: 'Junior Range',  cta: 'Browse juniors', alt: 'Player set in a ready stance on clay' }
];

const COACHES = [
  { img: `${ASSET}/5.jpg`, name: 'Marco Vidal',    role: 'Head Coach',        alt: 'Head coach set in a ready stance on clay',       headline: ['Expert', 'Result-', 'Driven', 'Coaching'] },
  { img: `${ASSET}/4.jpg`, name: 'Elena Sokolova', role: 'Performance Coach', alt: 'Performance coach following through on a serve', headline: ['Sharper', 'Faster', 'Stronger', 'Player'] },
  { img: `${ASSET}/1.jpg`, name: 'James Okoro',    role: 'Juniors Lead',      alt: 'Juniors lead waiting to return on clay',         headline: ['Future', 'Champions', 'Start', 'Here'] }
];

/* =====================================================================
   11. Bolinhas de carrossel
   ===================================================================== */
function createDots(container, count, onSelect) {
  const buttons = [];

  for (let i = 0; i < count; i++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dot';
    button.setAttribute('aria-label', `Go to slide ${i + 1}`);

    const pill = document.createElement('span');
    pill.className = 'dot-pill';
    button.appendChild(pill);

    button.addEventListener('click', () => onSelect(i));
    container.appendChild(button);
    buttons.push(button);
  }

  return {
    set(active) {
      buttons.forEach((button, i) => {
        button.classList.toggle('active', i === active);
        if (i === active) button.setAttribute('aria-current', 'true');
        else button.removeAttribute('aria-current');
      });
    }
  };
}

/* =====================================================================
   12. Hero
   ===================================================================== */
const heroSection = $('.hero');

/* --- carrossel de coleções --- */
const collectionCard = $('#collection-card');
const collectionTrack = $('#collection-track');
const CROSSFADE = { tension: 210, friction: 24 };
let collectionIndex = 0;
let autoplayTimer = null;

function collectionMarkup({ img, alt, brand, title, cta }) {
  return `<img src="${img}" alt="${alt}" loading="lazy">
    <div class="col-info">
      <p class="col-brand">${brand}</p>
      <p class="col-title">${title}</p>
      <a class="col-cta" href="subpage.html?id=shop">${cta} →</a>
    </div>`;
}

collectionCard.innerHTML = collectionMarkup(COLLECTIONS[0]);

const collectionDots = createDots($('#collection-dots'), COLLECTIONS.length, i => {
  if (i === collectionIndex) return;
  goToCollection(i);
  restartAutoplay();
});
collectionDots.set(0);

function goToCollection(index) {
  // clone do card que sai, para o cross-fade
  const outgoing = collectionCard.cloneNode(true);
  outgoing.classList.add('col-ghost');
  outgoing.removeAttribute('id');
  collectionTrack.appendChild(outgoing);
  springSet(outgoing, { opacity: 1, y: 0, scale: 1 });
  springTo(outgoing, { opacity: 0, y: 16, scale: 0.96 }, CROSSFADE);
  setTimeout(() => outgoing.remove(), 700);

  collectionIndex = index;
  collectionCard.innerHTML = collectionMarkup(COLLECTIONS[index]);
  springSet(collectionCard, { opacity: 0, y: 16, scale: 0.96 });
  springTo(collectionCard, { opacity: 1, y: 0, scale: 1 }, CROSSFADE);
  collectionDots.set(index);
}

function startAutoplay() {
  if (autoplayTimer) return;
  autoplayTimer = setInterval(
    () => goToCollection((collectionIndex + 1) % COLLECTIONS.length),
    3800
  );
}

function stopAutoplay() {
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
}

function restartAutoplay() {
  if (!autoplayTimer) return;
  stopAutoplay();
  startAutoplay();
}

/* --- reveal do hero ligado ao scroll (aparece rolando, some ao voltar) --- */
const sliderEl = $('#collection-slider');
const membershipEl = $('#membership-card');
const heroRevealItems = [$('#hero-title'), $('#hero-tagline'), sliderEl, membershipEl];

// começa tudo escondido (o loader cobre a tela nesse momento)
heroRevealItems.forEach(el => { el.style.opacity = '0'; el.style.transform = 'translateY(28px)'; });

const REVEAL_START = 0.70;   // ponto do scroll onde começa a surgir
const REVEAL_SPAN = 0.16;    // extensão do fade de cada item
const REVEAL_STAGGER = 0.03; // atraso entre os itens
let autoplayOn = false;

// mapeia o progresso do scroll → opacidade/deslocamento de cada item (reversível)
function applyHeroReveal(progress) {
  heroRevealItems.forEach((el, i) => {
    const raw = (progress - (REVEAL_START + i * REVEAL_STAGGER)) / REVEAL_SPAN;
    const f = raw < 0 ? 0 : raw > 1 ? 1 : raw;
    const ease = f * f * (3 - 2 * f); // smoothstep
    el.style.opacity = ease.toFixed(3);
    el.style.transform = `translateY(${((1 - ease) * 28).toFixed(1)}px)`;
  });
  // autoplay do carrossel só enquanto o hero está visível
  const shouldPlay = progress >= REVEAL_START + 0.08;
  if (shouldPlay && !autoplayOn) { autoplayOn = true; startAutoplay(); }
  else if (!shouldPlay && autoplayOn) { autoplayOn = false; stopAutoplay(); }
}
// applyHeroReveal() é comandado pelo scrub (seção 23) a cada quadro

/* =====================================================================
   13. Trust — palavras fantasma + carrossel de treinadores
   ===================================================================== */
const trustSection = $('#trust');
const ghostWords = $$('.ghost-word', trustSection);
const ghostSegments = ghostWords.map(word => $('.seg', word));
const GHOST_PARALLAX = [[-3, 3], [3, -3], [-2, 4], [4, -3]];

ghostWords.forEach((word, i) => {
  const [from, to] = GHOST_PARALLAX[i];
  addParallax(trustSection, word, (el, progress) => {
    el.style.transform = `translateX(${(from + (to - from) * progress).toFixed(3)}%)`;
  });
});

hideSegments(ghostSegments, '115%');

function playGhostWords() {
  hideSegments(ghostSegments, '115%');
  playSegments(ghostSegments, { duration: 700, ease: EXPO });
}
onInview($('#trust-title'), playGhostWords);

inview($('#percent-badge'), { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }, { tension: 220, friction: 22 });
inview($('#badge-card'), { opacity: 0, y: 24 }, { opacity: 1, y: 0 }, { tension: 200, friction: 26 }, 120);
inview($('#coach-card'), { opacity: 0, y: 60, scale: 0.92 }, { opacity: 1, y: 0, scale: 1 }, { tension: 170, friction: 26 });

const coachFigure = $('#coach-fig');
const coachCaption = $('.coach-caption', coachFigure);
let coachImage = $('.coach-img', coachFigure);
let coachIndex = 0;

const coachDots = createDots($('#trust-dots'), COACHES.length, i => {
  if (i !== coachIndex) goToCoach(i);
});
coachDots.set(0);

function goToCoach(index) {
  coachIndex = ((index % COACHES.length) + COACHES.length) % COACHES.length;
  const coach = COACHES[coachIndex];

  // re-dispara as palavras fantasma com o novo headline
  coach.headline.forEach((word, i) => { ghostSegments[i].textContent = word; });
  $('#trust-title').setAttribute('aria-label', coach.headline.join(' '));
  playGhostWords();

  // cross-fade da foto
  const image = document.createElement('img');
  image.className = 'coach-img';
  image.src = coach.img;
  image.alt = coach.alt;
  image.loading = 'lazy';
  coachFigure.insertBefore(image, coachCaption);
  springSet(image, { opacity: 0 });
  springTo(image, { opacity: 1 }, { tension: 260, friction: 26 });

  const previous = coachImage;
  coachImage = image;
  setTimeout(() => previous.remove(), 800);

  $('#coach-name').textContent = coach.name;
  $('#coach-role').textContent = coach.role;
  coachDots.set(coachIndex);
}

$('#trust-prev').addEventListener('click', () => goToCoach(coachIndex - 1));
$('#trust-next').addEventListener('click', () => goToCoach(coachIndex + 1));

$$('.arrow-btn').forEach(button => {
  hover(button, $('svg', button), { scale: 1 }, { scale: 1.15 }, { tension: 320, friction: 18 });
});

/* =====================================================================
   14. Programs
   ===================================================================== */
textRevealInview($('#programs-title'), { mode: 'lines', stagger: 120, duration: 950, ease: EXPO });

$$('.program-row').forEach((row, i) => {
  inview($('.row-inner', row), { opacity: 0, y: 26 }, { opacity: 1, y: 0 }, { tension: 190, friction: 26 }, i * 90);

  const arrow = $('.row-arrow', row);
  springSet(arrow, { x: 0, opacity: 0.55 });
  hover($('a', row), arrow, { x: 0, opacity: 0.55 }, { x: 8, opacity: 1 }, { tension: 300, friction: 20 });
});

/* =====================================================================
   15. Facilities
   ===================================================================== */
inview($('#fac-icon'), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }, { tension: 240, friction: 20 });
textRevealInview($('#facilities-title'), { mode: 'lines', stagger: 120, duration: 950, ease: EXPO });
textRevealInview($('#fac-body'), { mode: 'wordfade', y: '18px', base: 250, stagger: 28, duration: 700, ease: QUART });

$$('.court-card').forEach((card, i) => {
  inview(card, { opacity: 0, y: 48 }, { opacity: 1, y: 0 }, { tension: 180, friction: 26 }, i * 140);
  hover(card, $('img', card), { scale: 1 }, { scale: 1.03 }, { tension: 300, friction: 22 });
});

/* =====================================================================
   16. Stats
   ===================================================================== */
textRevealInview($('#stats-title'), { mode: 'lines', stagger: 120, duration: 950, ease: EXPO });

$$('.stat').forEach((cell, i) => {
  inview(cell, { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, { tension: 180, friction: 24 }, i * 110);
});

/* =====================================================================
   17. Testimonials
   ===================================================================== */
textRevealInview($('#testimonials-title'), { mode: 'lines', stagger: 120, duration: 950, ease: EXPO });
inview($('#testi-video'), { opacity: 0, y: 30 }, { opacity: 1, y: 0 }, { tension: 180, friction: 26 });

$$('.testi-card').forEach((card, i) => {
  inview(card, { opacity: 0, y: 40 }, { opacity: 1, y: 0 }, { tension: 180, friction: 26 }, i * 120);
  hover(card, card, { y: 0 }, { y: -8 }, { tension: 300, friction: 22 });
});

/* =====================================================================
   18. Footer + setas dos pills
   ===================================================================== */
textRevealInview($('#footer-cta-title'), { mode: 'lines', stagger: 120, duration: 950, ease: EXPO });
inview($('#footer-book'), { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, { tension: 200, friction: 24 }, 150);

$$('.pill').forEach(pill => {
  const arrow = $('svg', pill);
  if (arrow) hover(pill, arrow, { x: 0 }, { x: 5 }, { tension: 320, friction: 20 });
});

/* =====================================================================
   19. Modal de contato
   ===================================================================== */
const modal = $('#contact-modal');
const modalBackdrop = $('.modal-backdrop', modal);
const modalPanel = $('.modal-panel', modal);
const contactForm = $('#contact-form');
const successPanel = $('#contact-success');
const submitButton = $('#submit-btn');
const nameInput = $('#f-name');

const modalTitleReveal = textReveal($('#modal-title'), {
  mode: 'lines', stagger: 90, duration: 800, ease: EXPO
});

let modalOpen = false;

function openModal() {
  if (modalOpen) return;
  modalOpen = true;

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  lockScroll();

  springSet(modalBackdrop, { opacity: 0 });
  springTo(modalBackdrop, { opacity: 1 }, { tension: 240, friction: 30 });
  springSet(modalPanel, { opacity: 0, y: 28, scale: 0.96 });
  springTo(modalPanel, { opacity: 1, y: 0, scale: 1 }, { tension: 240, friction: 26 });

  modalTitleReveal.play();
  setTimeout(() => nameInput.focus(), 120);
}

function closeModal() {
  if (!modalOpen) return;
  modalOpen = false;

  modal.setAttribute('aria-hidden', 'true');
  springTo(modalBackdrop, { opacity: 0 }, { tension: 240, friction: 30 });
  springTo(modalPanel, { opacity: 0, y: 28, scale: 0.96 }, { tension: 240, friction: 26 });
  unlockScroll();

  setTimeout(() => modal.classList.remove('open'), 400);
  setTimeout(resetContactForm, 350);
}

function resetContactForm() {
  contactForm.reset();
  contactForm.hidden = false;
  successPanel.hidden = true;
  submitButton.disabled = false;
  submitButton.textContent = 'Request a visit';
}

contactForm.addEventListener('submit', event => {
  event.preventDefault(); // stub — nunca envia nada para a rede
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';

  const firstName = nameInput.value.trim().split(/\s+/)[0] || 'there';

  setTimeout(() => {
    $('#success-name').textContent = firstName;
    contactForm.hidden = true;
    successPanel.hidden = false;
  }, 900);
});

$('#modal-close').addEventListener('click', closeModal);
$('#success-done').addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
hover($('#modal-close'), $('#modal-close svg'), { rotate: 0 }, { rotate: 90 }, { tension: 300, friction: 18 });
$$('[data-open-modal]').forEach(el => el.addEventListener('click', openModal));

/* =====================================================================
   20. Menu em tela cheia
   ===================================================================== */
const menu = $('#menu');
const menuBackdrop = $('.menu-backdrop', menu);
const menuPanel = $('.menu-inner', menu);
const menuLinks = $$('.menu__item', menu);

let menuOpen = false;

function openMenu() {
  if (menuOpen) return;
  menuOpen = true;

  menu.classList.add('open');
  menu.setAttribute('aria-hidden', 'false');
  $('#menu-open').setAttribute('aria-expanded', 'true');
  lockScroll();

  springSet(menuBackdrop, { opacity: 0 });
  springTo(menuBackdrop, { opacity: 1 }, { tension: 260, friction: 30 });
  springSet(menuPanel, { opacity: 0, y: -24 });
  springTo(menuPanel, { opacity: 1, y: 0 }, { tension: 220, friction: 28 });

  menuLinks.forEach((link, i) => {
    springSet(link, { opacity: 0, y: 28 });
    setTimeout(() => springTo(link, { opacity: 1, y: 0 }, { tension: 200, friction: 26 }), 120 + i * 70);
  });
}

function closeMenu() {
  if (!menuOpen) return;
  menuOpen = false;

  menu.setAttribute('aria-hidden', 'true');
  $('#menu-open').setAttribute('aria-expanded', 'false');
  springTo(menuBackdrop, { opacity: 0 }, { tension: 260, friction: 30 });
  springTo(menuPanel, { opacity: 0, y: -24 }, { tension: 220, friction: 28 });
  unlockScroll();

  setTimeout(() => menu.classList.remove('open'), 400);
}

$('#menu-open').addEventListener('click', openMenu);
$('#menu-close').addEventListener('click', closeMenu);
menuBackdrop.addEventListener('click', closeMenu);
hover($('#menu-close'), $('#menu-close svg'), { rotate: 0 }, { rotate: 90 }, { tension: 300, friction: 18 });
$('#menu-book').addEventListener('click', () => { closeMenu(); openModal(); });

addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (modalOpen) closeModal();
  else if (menuOpen) closeMenu();
});

/* =====================================================================
   21. Âncoras com scroll suave
   ===================================================================== */
$$('a[data-scroll]').forEach(link => {
  link.addEventListener('click', event => {
    const target = $(link.getAttribute('href'));
    if (!target) return;
    event.preventDefault();
    if (menuOpen) closeMenu();
    lenis.scrollTo(target, { offset: -12 });
  });
});

// botão da marca (href="#") volta ao topo suavemente
$$('a.brand[href="#"]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    if (menuOpen) closeMenu();
    lenis.scrollTo(0);
  });
});

/* =====================================================================
   22. Loader
   ===================================================================== */
const MIN_VISIBLE_MS = REDUCED_MOTION ? 200 : 1400;
const MAX_VISIBLE_MS = 2600;
const EXIT_MS = REDUCED_MOTION ? 0 : 850;

const loader = $('#loader');
const startedAt = performance.now();
let loaderDone = false;

lockScroll(); // a página monta travada (html.locked vem do <head>)

springSet($('#loader-mark'), { opacity: 0, y: 16 });
springTo($('#loader-mark'), { opacity: 1, y: 0 }, { tension: 200, friction: 22 });
requestAnimationFrame(() => $('#loader-fill').classList.add('run'));

function finishLoader() {
  if (loaderDone) return;
  loaderDone = true;

  unlockScroll(); // ready = true → Lenis volta a rodar
  // applyHeroReveal() controla o hero via scrub (seção 23), ligado ao scroll

  if (wantsBooking) {
    setTimeout(openModal, 150); // abre o modal se veio via ?book=1
    // remove o ?book=1 da URL pra o modal NÃO reabrir ao recarregar / voltar
    history.replaceState(null, '', location.pathname + location.hash);
  }

  // se veio de outra página com âncora (ex.: index.html#programs), rola até a seção
  if (location.hash.length > 1) {
    let target = null;
    try { target = document.querySelector(location.hash); } catch { /* hash não é um seletor válido (ex.: #a b) */ }
    if (target) setTimeout(() => lenis.scrollTo(target, { offset: -12 }), 200);
  }

  if (!EXIT_MS) {
    loader.remove();
    return;
  }
  loader.style.transition = `transform ${EXIT_MS}ms ${INOUT}`;
  loader.style.transform = 'translateY(-105%)';
  setTimeout(() => loader.remove(), EXIT_MS);
}

// se a página foi aberta com ?book=1 (vindo do "Book a Visit" de outra página), abre o modal
const wantsBooking = new URLSearchParams(location.search).get('book') === '1';

function armCountdown() {
  const elapsed = performance.now() - startedAt;
  setTimeout(finishLoader, Math.max(0, MIN_VISIBLE_MS - elapsed));
}

if (document.readyState === 'complete') armCountdown();
else addEventListener('load', armCountdown);

setTimeout(finishLoader, MAX_VISIBLE_MS); // rede de segurança se 'load' nunca disparar

/* =====================================================================
   23. Vídeo do hero — frames extraídos do MP4 em runtime, scrubbed pelo scroll
   (o MP4 é decodificado uma vez no load e vira uma sequência de frames em
   memória; o scroll então só troca frames — suave como a versão em imagens.)
   ===================================================================== */
(() => {
  const canvas = document.getElementById('hero-canvas');
  const hintEl = document.getElementById('hero-hint');
  if (!canvas || !heroSection) return;

  // MOBILE: hero toca o vídeo normal (Video Home.mp4), sem frames nem scroll
  if (matchMedia('(max-width: 768px)').matches) {
    applyHeroReveal(1);          // mostra título/tagline/cartões de cara
    hintEl.style.opacity = '0';  // sem a dica "Scroll"
    const v = document.createElement('video');
    v.className = 'hero-canvas'; // mesmo posicionamento/cover do canvas
    v.src = 'assent/Video%20Home.mp4';
    v.autoplay = v.loop = v.muted = v.defaultMuted = v.playsInline = true;
    ['muted', 'playsinline', 'autoplay', 'loop'].forEach(a => v.setAttribute(a, ''));
    canvas.replaceWith(v);
    v.play().catch(() => {});
    return;
  }

  const ctx = canvas.getContext('2d');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const FRAME_COUNT = 96;
  const FRAME_DIR = 'frames-home/frame-'; // frames extraídos do Video Home.mp4 (12 fps)

  // pré-carrega todos os frames JPG (funciona no duplo-clique, file://)
  const frames = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = FRAME_DIR + String(i + 1).padStart(3, '0') + '.jpg';
    if (i === 0) img.onload = () => draw(0);
    frames.push(img);
  }

  let lastDrawn = -1;
  const ready = idx => { const f = frames[idx]; return f && f.complete && f.naturalWidth > 0; };
  function draw(idx) {
    if (!ready(idx)) return false;
    ctx.drawImage(frames[idx], 0, 0, canvas.width, canvas.height);
    lastDrawn = idx;
    return true;
  }

  // DESKTOP: scrub dos frames controlado pelo scroll (chamado a cada quadro pelo rAF)
  introFrame = function () {
      const scrollable = heroSection.offsetHeight - innerHeight;
      const rect = heroSection.getBoundingClientRect();
      const progress = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

      const target = Math.round(progress * (FRAME_COUNT - 1));
      if (target !== lastDrawn) {
        if (!draw(target)) {
          for (let j = target; j >= 0; j--) if (draw(j)) break; // frame carregado mais próximo
        }
      }

      // dica "Scroll" some assim que começa a rolar
      hintEl.style.opacity = String(clamp(1 - progress / 0.06, 0, 1));

      // frase/cartões surgem e somem gradualmente conforme o scroll (reversível)
      applyHeroReveal(progress);
    };
})();

/* =====================================================================
   24. Flowing menu — faixa (marquee) que desliza da borda no hover
   (reimplementação vanilla do efeito React/GSAP; sem libs)
   ===================================================================== */
(() => {
  const items = $$('#menu .menu__item');
  if (!items.length) return;
  const EASE = 'cubic-bezier(0.19, 1, 0.22, 1)';

  items.forEach(item => {
    const link = $('.menu__item-link', item);
    const marquee = $('.marquee', item);
    const inner = $('.marquee__inner', item);
    const scroll = $('.marquee__scroll', item);
    const text = link.textContent.trim();
    const img = link.dataset.img || '';
    const partHTML = `<span>${text}</span><div class="marquee__img" style="background-image:url('${img}')"></div>`;

    // monta cópias suficientes p/ loop horizontal contínuo e sem emenda (-50%)
    function build() {
      scroll.innerHTML = `<div class="marquee__part">${partHTML}</div>`;
      const partW = scroll.firstElementChild.offsetWidth || 300;
      const itemW = item.offsetWidth || innerWidth;
      let count = Math.max(6, Math.ceil((itemW * 2.4) / partW));
      if (count % 2) count++; // par → -50% cai numa cópia idêntica (seamless)
      scroll.innerHTML = Array.from({ length: count }, () => `<div class="marquee__part">${partHTML}</div>`).join('');
      scroll.style.animationDuration = Math.max(8, (partW * count) / 2 / 90).toFixed(2) + 's'; // ~90px/s
    }
    build();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build); // recalcula após a fonte carregar
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(build, 200); });

    const enteredFromTop = ev => {
      const r = item.getBoundingClientRect();
      return ev.clientY - r.top < r.height / 2;
    };

    link.addEventListener('mouseenter', ev => {
      const top = enteredFromTop(ev);
      marquee.style.transition = 'none';
      inner.style.transition = 'none';
      marquee.style.transform = `translate3d(0, ${top ? '-101%' : '101%'}, 0)`;
      inner.style.transform = `translate3d(0, ${top ? '101%' : '-101%'}, 0)`;
      requestAnimationFrame(() => {
        marquee.style.transition = `transform 0.6s ${EASE}`;
        inner.style.transition = `transform 0.6s ${EASE}`;
        marquee.style.transform = 'translate3d(0, 0, 0)';
        inner.style.transform = 'translate3d(0, 0, 0)';
      });
    });

    link.addEventListener('mouseleave', ev => {
      const top = enteredFromTop(ev);
      marquee.style.transition = `transform 0.6s ${EASE}`;
      inner.style.transition = `transform 0.6s ${EASE}`;
      marquee.style.transform = `translate3d(0, ${top ? '-101%' : '101%'}, 0)`;
      inner.style.transform = `translate3d(0, ${top ? '101%' : '-101%'}, 0)`;
    });
  });
})();
