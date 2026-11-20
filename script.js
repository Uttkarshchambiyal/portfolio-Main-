/* =========================================================
   UTTKARSH CHAMBIYAL — PORTFOLIO
   GSAP + ScrollTrigger for motion, Lenis for smooth scroll,
   raw WebGL for the contour-line backgrounds.
   ========================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const DESKTOP = '(min-width: 901px)';
const MOBILE = '(max-width: 900px)';

let lenis = null;

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  mountSignatures();
  splitStatement();
  buildPractice();
  buildGraph();
  initClock();
  initLenis();
  initUI();
  initMenu();
  initLinks();
  initBackground();
  initHeroField();
  initPersonFX();
  loadLiveNumbers();
  showResumeIfPresent();

  const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
  runLoader(fonts).then(() => {
    document.body.classList.remove('is-loading');
    lenis?.start();
    intro();
    initScroll();
    ScrollTrigger.refresh();
  });
  window.addEventListener('load', () => ScrollTrigger.refresh());
});

/* =========================================================
   SIGNATURE — hand-drawn strokes, animated with dash offset
   ========================================================= */
const SIGNATURE = `
<svg viewBox="40 10 650 290" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <g transform="skewX(-14) translate(70 0)">
    <path pathLength="1" d="M118 52 C 96 140, 78 226, 116 232 C 156 238, 192 142, 212 62 C 198 146, 188 206, 210 212 C 226 216, 244 160, 264 92 C 252 150, 242 196, 252 206 C 268 176, 286 146, 300 150 C 306 168, 292 196, 300 204 C 318 168, 338 134, 352 142 C 340 176, 352 204, 380 176 C 398 156, 412 146, 410 172 C 408 196, 428 200, 456 170 C 486 138, 520 112, 590 92"/>
    <path pathLength="1" d="M160 168 C 300 132, 450 84, 610 30"/>
    <path pathLength="1" d="M70 274 C 170 256, 250 250, 330 254"/>
  </g>
</svg>`;

function mountSignatures() {
  $$('[data-signature]').forEach((el) => {
    el.innerHTML = SIGNATURE;
    // dash 1 + gap 2, parked just past the start, so no round pen-tip shows before drawing
    $$('path', el).forEach((p) => { p.style.strokeDasharray = '1 2'; p.style.strokeDashoffset = REDUCED ? '0' : '1.02'; });
  });
}

function drawSignature(el, { duration = 1.6, delay = 0 } = {}) {
  const lens = [1, .34, .22];
  const total = lens.reduce((a, b) => a + b, 0);
  const tl = gsap.timeline({ delay });
  $$('path', el).forEach((p, i) => {
    tl.to(p, { strokeDashoffset: 0, duration: duration * (lens[i] / total), ease: i === 0 ? 'power1.inOut' : 'power2.out' });
  });
  return tl;
}

/* =========================================================
   TEXT HELPERS
   ========================================================= */
// wrap each word of the statement so it can light up on scroll
function splitStatement() {
  $$('[data-words]').forEach((root) => {
    const walk = (node) => [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(' '); return; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.append(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) walk(child);
    });
    walk(root);
  });
}

// Highlight reveal: a block of colour sweeps across each line, then
// uncovers the text. Titles use their own line spans; paragraphs
// marked data-hl are split into measured lines first.
function splitLines(p) {
  const tokens = [];
  [...p.childNodes].forEach((n) => {
    if (n.nodeType !== 3) { tokens.push(n); return; }
    n.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { tokens.push(document.createTextNode(' ')); return; }
      const s = document.createElement('span');
      s.textContent = part;
      tokens.push(s);
    });
  });
  p.replaceChildren(...tokens);
  const lines = [];
  let top = null;
  tokens.forEach((t) => {
    if (t.nodeType === 3) { lines[lines.length - 1]?.push(t); return; }
    if (top === null || Math.abs(t.offsetTop - top) > 4) { lines.push([]); top = t.offsetTop; }
    lines[lines.length - 1].push(t);
  });
  p.replaceChildren();
  lines.forEach((ln, i) => {
    while (ln.length && ln[ln.length - 1].nodeType === 3) ln.pop();
    const span = document.createElement('span');
    span.className = 'hl hl-p';
    span.append(...ln);
    p.append(span);
    if (i < lines.length - 1) p.append(document.createElement('br'));
  });
  return $$(':scope > .hl', p);
}

function sweep(lines, trigger, { dir = 'right', start = 'top 88%', delay = 0 } = {}) {
  if (!lines.length) return;
  const ins = []; const boxes = [];
  lines.forEach((ln) => {
    ln.classList.add('hl');
    const inner = document.createElement('span');
    inner.className = 'hl-in';
    inner.append(...ln.childNodes);
    const box = document.createElement('span');
    box.className = 'hl-box';
    ln.append(inner, box);
    ins.push(inner); boxes.push(box);
  });
  const a = dir === 'right' ? 'left' : 'right';
  const b = dir === 'right' ? 'right' : 'left';
  gsap.set(ins, { opacity: 0 });
  gsap.timeline({ delay, scrollTrigger: { trigger, start } })
    .fromTo(boxes, { scaleX: 0, transformOrigin: `${a} center` }, { scaleX: 1, duration: .55, ease: 'expo.inOut', stagger: .09 })
    .to(ins, { opacity: 1, duration: .01, stagger: .09 }, .55)
    .to(boxes, { scaleX: 0, transformOrigin: `${b} center`, duration: .55, ease: 'expo.inOut', stagger: .09, immediateRender: false }, .56);
}

function revealTitles() {
  $$('.title, .split-title, .footer-title').forEach((title) => {
    const lines = [...title.children].filter((c) => c.tagName === 'SPAN');
    const dir = title.closest('.split-col-r') ? 'left' : 'right';
    sweep(lines, title, { dir });
  });
  $$('[data-hl]').forEach((p) => {
    const dir = p.closest('.split-col-r') ? 'left' : 'right';
    sweep(splitLines(p), p, { dir, delay: .2 });
  });
}

function fadeUp(sel, stagger = 0) {
  $$(sel).forEach((el, i) => {
    gsap.from(el, { y: 40, opacity: 0, duration: 1.3, ease: 'expo.out', delay: stagger ? (i % 4) * stagger : 0, scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
}

/* =========================================================
   LOADER + INTRO
   ========================================================= */
function runLoader(fonts) {
  const loader = $('.loader');
  if (!loader || REDUCED) { loader?.remove(); return Promise.resolve(); }
  return new Promise((resolve) => {
    const sig = drawSignature($('.loader-sig'), { duration: 1.5, delay: .2 });
    Promise.all([fonts, new Promise((r) => sig.eventCallback('onComplete', r))]).then(() => {
      gsap.timeline({ onComplete: () => loader.remove() })
        .to('.loader-sig', { y: -30, opacity: 0, duration: .5, ease: 'power2.in' }, .15)
        .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, .3)
        .add(resolve, .7);
    });
  });
}

function intro() {
  if (REDUCED) return;
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hp-media', { yPercent: 14, opacity: 0, duration: 1.9 }, .1)
    .from('.hero-card', { y: 40, opacity: 0, duration: 1.2 }, .75)
    .from('.hero-card-outline path', { strokeDasharray: '0 1200', duration: 1.6, ease: 'power2.inOut' }, .8)
    .from('.hero-name span', { yPercent: 105, duration: 1.5 }, 0)
    .from('.hero-side > *', { y: 30, opacity: 0, duration: 1.1, stagger: .08 }, .8)
    .from('.header > *', { y: -24, opacity: 0, duration: 1.2, stagger: .08 }, .7);
}

/* =========================================================
   SMOOTH SCROLL, LINKS, MENU, CLOCK
   ========================================================= */
function initLenis() {
  if (REDUCED) return;
  lenis = new Lenis({ lerp: .085, smoothWheel: true });
  lenis.stop();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

function scrollToTarget(target) {
  if (lenis) lenis.scrollTo(target, { duration: 1.6, offset: target === 0 ? 0 : -20, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (target === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
  else $(target)?.scrollIntoView({ behavior: 'smooth' });
}

function initLinks() {
  $$('[data-scroll-to]').forEach((a) => a.addEventListener('click', (e) => {
    const href = a.getAttribute('href');
    if (!href?.startsWith('#')) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(href === '#top' ? 0 : href);
  }));
}

function initMenu() {
  const btn = $('.menu-btn');
  btn.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    $('.menu').setAttribute('aria-hidden', !open);
    if (open) {
      lenis?.stop();
      gsap.fromTo('.menu-links li', { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 1, stagger: .06, ease: 'expo.out', delay: .3 });
      gsap.fromTo('.menu-foot', { opacity: 0 }, { opacity: 1, duration: .8, delay: .7 });
    } else lenis?.start();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
}

function closeMenu() {
  if (!document.body.classList.contains('menu-open')) return;
  document.body.classList.remove('menu-open');
  $('.menu-btn').setAttribute('aria-expanded', 'false');
  $('.menu-btn').setAttribute('aria-label', 'Open menu');
  $('.menu').setAttribute('aria-hidden', 'true');
  lenis?.start();
}

function initClock() {
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  const tick = () => $$('[data-clock]').forEach((el) => { el.textContent = fmt.format(new Date()); });
  tick();
  setInterval(tick, 15000);
}

/* =========================================================
   UI LAYER — smart header, progress line, rolling button
   labels, magnetic buttons, a small custom cursor
   ========================================================= */
function initUI() {
  const header = $('.header');
  const bar = document.createElement('div');
  bar.className = 'progress';
  bar.innerHTML = '<span></span>';
  document.body.append(bar);
  const fill = $('span', bar);
  let last = 0;
  const onScroll = (y) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    fill.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    header.classList.toggle('is-scrolled', y > innerHeight * .8);
    if (!document.body.classList.contains('menu-open')) {
      if (y > innerHeight && y > last + 4) header.classList.add('is-hidden');
      else if (y < last - 4 || y < innerHeight) header.classList.remove('is-hidden');
    }
    last = y;
  };
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  else addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  rollLabels(document);
  if (!FINE) return;

  if (!REDUCED) {
    $$('.btn-lime, .btn-ghost, .btn-outline, .menu-btn').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: .6, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: .6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .22);
        yTo((e.clientY - r.top - r.height / 2) * .3);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  }

  const cursor = document.createElement('div');
  cursor.className = 'cursor is-hidden';
  cursor.innerHTML = '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
  document.body.append(cursor);
  document.documentElement.classList.add('has-cursor');
  const ring = $('.cursor-ring', cursor);
  const dot = $('.cursor-dot', cursor);
  const dx = gsap.quickTo(dot, 'x', { duration: .08, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: .08, ease: 'power3' });
  const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' });
  const ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
  addEventListener('pointermove', (e) => {
    cursor.classList.remove('is-hidden');
    dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
  });
  document.addEventListener('pointerover', (e) => cursor.classList.toggle('is-link', !!e.target.closest('a, button')));
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.add('is-hidden'));
}

// the text rolls up and a fresh copy rolls in from below on hover
function rollLabels(root) {
  $$('.btn-lime, .btn-ghost, .btn-outline', root).forEach((btn) => {
    const label = [...btn.children].find((c) => c.tagName === 'SPAN' && !c.hasAttribute('aria-hidden') && c.textContent.trim().length > 1);
    if (!label || label.classList.contains('roll')) return;
    const text = label.textContent;
    label.classList.add('roll');
    label.innerHTML = '';
    const inner = document.createElement('span');
    inner.className = 'roll-in';
    inner.dataset.text = text;
    inner.textContent = text;
    label.append(inner);
  });
}

/* =========================================================
   SCROLL CHOREOGRAPHY
   ========================================================= */
function initScroll() {
  if (REDUCED) {
    $$('.statement .w').forEach((w) => w.classList.add('on'));
    renderPractice(1);
    return;
  }

  const mm = gsap.matchMedia();

  // Hero: pins, clears away, and the photo shrinks into the note frame
  heroScene();
  if (FINE) {
    const px = gsap.quickTo('.hp-media', 'x', { duration: 1.2, ease: 'power3' });
    const py = gsap.quickTo('.hp-media', 'y', { duration: 1.2, ease: 'power3' });
    const nameX = gsap.quickTo('.hero-name span', 'x', { duration: 1.6, ease: 'power3' });
    $('.hero').addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - .5;
      const ny = e.clientY / innerHeight - .5;
      const live = scrollY < innerHeight * .1 ? 1 : 0; // keep the framed photo still
      px(nx * 18 * live); py(ny * 8 * live); nameX(nx * -40);
    });
    ScrollTrigger.create({ start: () => innerHeight * .1, onEnter: () => { px(0); py(0); } });
  }

  // Marquees drift slowly and follow the scroll direction
  $$('[data-marquee]').forEach((row) => {
    const dir = +row.dataset.marquee;
    const tween = gsap.fromTo(row, { xPercent: dir > 0 ? 0 : -50 }, { xPercent: dir > 0 ? -50 : 0, duration: 40, ease: 'none', repeat: -1 });
    lenis?.on('scroll', ({ direction }) => gsap.to(tween, { timeScale: direction < 0 ? -1 : 1, duration: .6, overwrite: true }));
  });

  // Statement: words light up as you read
  const words = $$('.statement .w');
  ScrollTrigger.create({
    trigger: '.statement', start: 'top 80%', end: 'bottom 45%', scrub: true,
    onUpdate: (s) => { const n = Math.round(s.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); },
  });
  fadeUp('.statement-cap');

  // Journey: pinned horizontal gallery
  journeyScroll();
  revealTitles();

  // Build / Solve
  splitScene();

  // Work
  workGrid(mm);
  fadeUp('.work-more > *', .08);

  // Practice
  mm.add(DESKTOP, () => practiceScroll(true));
  mm.add(MOBILE, () => practiceScroll(false));
  practiceHover();
  fadeUp('.practice-cap');
  gsap.from('.plegend li', { x: -40, opacity: 0, duration: 1.1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: '.plegend', start: 'top 90%' } });
  gsap.from('.matrix-wrap', { y: 60, opacity: 0, rotateX: 18, transformPerspective: 1200, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.matrix-wrap', start: 'top 92%' } });
  gsap.from('.numbers li', { y: 40, opacity: 0, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: '.numbers', start: 'top 90%' } });
  fadeUp('.numbers-cap');

  // Stack: the brush word writes itself over the title
  gsap.fromTo('.stack-script', { clipPath: 'inset(-30% 100% -30% -10%)' }, { clipPath: 'inset(-30% -10% -30% -10%)', duration: 1.7, ease: 'power2.inOut', scrollTrigger: { trigger: '.stack-head', start: 'top 72%' } });
  gsap.from('.logo-rows', { y: 60, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.logo-rows', start: 'top 92%' } });

  // Hire: copy + a collage that drops into place
  fadeUp('.hire-cap, .hire-actions', .08);
  gsap.from('.hcard', { y: 160, opacity: 0, duration: 1.5, stagger: .12, ease: 'expo.out', clearProps: 'transform', scrollTrigger: { trigger: '.hire-collage', start: 'top 85%' } });
  gsap.from('.hire-stamp', { scale: 1.8, opacity: 0, duration: 1.2, ease: 'expo.out', delay: .5, scrollTrigger: { trigger: '.hire-collage', start: 'top 85%' } });

  // Connect: the hand of cards fans out
  fanCards();

  // Numbers count up the first time they come into view
  $$('[data-count]').forEach((el) => {
    el.textContent = '0';
    ScrollTrigger.create({
      trigger: el, start: 'top 92%', once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, {
          v: +el.dataset.count, duration: 2, ease: 'expo.out',
          onUpdate: () => { el.textContent = Math.round(o.v); },
          onComplete: () => { el.textContent = el.dataset.count; el.dataset.done = '1'; },
        });
      },
    });
  });

  // Footer
  fadeUp('.footer-col', .1);
  gsap.from('.footer-word', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer-card', start: 'top 60%', end: 'bottom bottom', scrub: true } });

  // pins were created out of page order; refresh them top to bottom
  ScrollTrigger.sort();
}

/* =========================================================
   HERO SCENE — the hero pins while the photo "minimises" into
   a framed portrait; the dark field melts into olive, the
   marquee rises behind it and the signature writes across.
   ========================================================= */
function heroScene() {
  const hero = $('.hero');
  const frame = $('.scene-frame');
  const photo = $('.hero-photo');
  // point of the photo that ends up in the frame's centre: between head and shoulders, on the head's axis
  const FX = .485; const FY = .36;

  const size = () => {
    const fw = Math.min(560, innerWidth * (innerWidth < 600 ? .84 : .76));
    const fh = fw * 360 / 560;
    hero.style.setProperty('--fw', `${fw}px`);
    hero.style.setProperty('--fh', `${fh}px`);
    return { x: (innerWidth - fw) / 2, y: (hero.clientHeight - fh) / 2, fh };
  };
  size();
  ScrollTrigger.addEventListener('refreshInit', size);

  const sig = $$('.scene-sig path');
  gsap.set(photo, { transformOrigin: `${FX * 100}% ${FY * 100}%` });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: hero, start: 'top top', end: () => `+=${innerHeight * 1.6}`, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
      // the light hero turns olive as the photo leaves
      onUpdate: (s) => { const t = s.progress > .1 ? 'olive' : 'paper'; if (hero.dataset.theme !== t) hero.dataset.theme = t; },
    },
  })
    .to('.hero-card, .hero-side', { y: 40, opacity: 0, duration: .18 }, 0)
    .to('.hero-name', { yPercent: -60, opacity: 0, duration: .3 }, 0)
    .to('.hero-gl', { opacity: 0, duration: .3 }, .05)
    .to(frame, {
      clipPath: () => { const s = size(); return `inset(${s.y}px ${s.x}px ${s.y}px ${s.x}px)`; },
      backgroundColor: 'rgba(200, 201, 192, 1)', duration: .45, ease: 'power2.inOut',
    }, .12)
    .to(photo, {
      scale: () => size().fh / (photo.offsetHeight * .8),
      x: () => photo.offsetWidth * (.5 - FX),
      y: () => hero.clientHeight / 2 - (photo.offsetTop + photo.offsetHeight * FY),
      duration: .45, ease: 'power2.inOut',
    }, .12)
    .to('.note-marquee', { opacity: 1, duration: .2 }, .38)
    .fromTo('.note-marquee', { y: 60 }, { y: 0, duration: .3, ease: 'power2.out' }, .38)
    .to('.scene-caption', { opacity: 1, duration: .1 }, .55)
    .to(sig[0], { strokeDashoffset: 0, duration: .22 }, .6)
    .to(sig[1], { strokeDashoffset: 0, duration: .08 }, .82)
    .to(sig[2], { strokeDashoffset: 0, duration: .06 }, .9)
    .to({}, { duration: .08 });
}

/* =========================================================
   WORK — staggered card grid. Cards rise in, screenshots settle,
   and on desktop the three columns drift at different speeds.
   ========================================================= */
function workGrid(mm) {
  $$('.pcard').forEach((card) => {
    const st = { trigger: card, start: 'top 92%' };
    gsap.from(card, { y: 120, opacity: 0, duration: 1.4, ease: 'expo.out', clearProps: 'transform', scrollTrigger: st });
    gsap.from($('.pcard-media img', card), { scale: 1.3, duration: 1.8, ease: 'expo.out', clearProps: 'transform', scrollTrigger: st });
  });
  mm.add(DESKTOP, () => {
    [[1, 40], [2, -90], [3, -30]].forEach(([n, y]) => {
      gsap.to(`.pcol:nth-child(${n})`, { y, ease: 'none', scrollTrigger: { trigger: '.pgrid', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });
}

/* =========================================================
   JOURNEY — the section pins and the track slides sideways.
   Halfway along, the surface turns from olive to paper.
   ========================================================= */
function buildGraph() {
  const graph = $('.graph');
  if (!graph) return;
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const cols = 26; const rows = 7;
  const cells = [];
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const busy = .25 + (c / cols) * .7;
      const v = rand();
      const l = v > busy ? 0 : v > busy * .6 ? 1 : v > busy * .32 ? 2 : v > busy * .12 ? 3 : 4;
      cells.push({ r, c, l });
    }
  }
  // grid flows row by row, so order cells row-major
  cells.sort((a, b) => a.r - b.r || a.c - b.c);
  graph.replaceChildren(...cells.map(({ c, l }) => {
    const i = document.createElement('i');
    if (l) i.dataset.l = l;
    i.style.setProperty('--c', c);
    return i;
  }));
}

function journeyScroll() {
  const sec = $('.journey');
  const track = $('.hz-track');
  if (!sec || !track) return;
  const dist = () => Math.max(0, track.scrollWidth - innerWidth);
  const tween = gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: {
      trigger: '.hz-pin', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
      onUpdate: (s) => { const t = s.progress > .4 ? 'paper' : 'olive'; if (sec.dataset.theme !== t) sec.dataset.theme = t; },
    },
  });

  // tiles already on screen rise in with the section; the rest as they slide in from the right
  $$('.hz-item, .hz-quote', track).forEach((el) => {
    const onScreen = el.getBoundingClientRect().left < innerWidth * .9;
    const st = onScreen ? { trigger: sec, start: 'top 55%' } : { trigger: el, containerAnimation: tween, start: 'left 92%' };
    gsap.from(el, { y: 90, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: st });
  });
  $$('.hz-sig', track).forEach((sig) => ScrollTrigger.create({
    trigger: sig, containerAnimation: tween, start: 'left 78%', once: true, onEnter: () => drawSignature(sig, { duration: 1.1 }),
  }));
  const graph = $('.graph');
  if (graph) {
    gsap.fromTo($$('i', graph), { scale: 0 }, {
      scale: 1, duration: .6, ease: 'back.out(2)', stagger: { each: .005, from: 'start' },
      scrollTrigger: { trigger: sec, start: 'top 30%' },
    });
  }
  // a light parallax inside the tiles
  $$('.tile-day-no, .tile-stat-num', track).forEach((el) => {
    gsap.fromTo(el, { xPercent: 12 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
  });
}

/* =========================================================
   BUILD / SOLVE — lime swooshes draw under each word and the
   giant braces slide in from the edges.
   ========================================================= */
function splitScene() {
  $$('.swoosh path').forEach((p) => { p.style.strokeDasharray = '1 2'; p.style.strokeDashoffset = '1.02'; });
  $$('.split-col').forEach((col) => {
    const st = { trigger: col, start: 'top 75%' };
    gsap.to($('.swoosh path', col), { strokeDashoffset: 0, duration: .9, delay: .7, ease: 'power2.inOut', scrollTrigger: st });
    gsap.fromTo($('.split-go', col), { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 1.1, delay: .8, ease: 'expo.out', scrollTrigger: st });
  });
  [['.split-glyph-l', -45, -10], ['.split-glyph-r', 45, 10]].forEach(([sel, x, r]) => {
    gsap.fromTo(sel, { xPercent: x, rotate: r }, { xPercent: 0, rotate: 0, ease: 'none', scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'center center', scrub: true } });
  });
}

/* =========================================================
   CONNECT — the cards start stacked, then fan out like a hand
   ========================================================= */
function fanCards() {
  const wide = innerWidth > 900;
  const R = wide ? [-9, -3, 3, 9] : [-3, 3, -3, 3];
  const st = { trigger: '.fan', start: 'top 85%' };
  gsap.from('.fan-item', { y: 160, opacity: 0, duration: 1.3, stagger: .07, ease: 'expo.out', scrollTrigger: st });
  gsap.fromTo('.fcard', { '--r': '0deg' }, { '--r': (i) => `${R[i]}deg`, duration: 1.6, ease: 'expo.out', delay: .3, scrollTrigger: st });
  // on wide screens the cards are dealt out from a single stack
  if (wide) gsap.fromTo('.fan', { '--s': 0 }, { '--s': 1, duration: 1.6, ease: 'expo.out', delay: .25, scrollTrigger: st });
  fadeUp('.connect-icon, .connect-sub, .connect-links', .08);
}

/* =========================================================
   PRACTICE BOARD — a rolling odometer plus a "solution matrix":
   one square per solved problem, coloured by platform. One
   scroll-driven progress value lights the squares in a diagonal
   wave; the legend counts the lit squares.
   ========================================================= */
const practice = { p: 0, cells: [], cols: [], keys: [] };

function buildPractice() {
  const matrix = $('.matrix');
  const odo = $('.odo');
  if (!matrix || !odo) return;
  practice.keys = $$('.pl').map((pl) => ({ key: pl.dataset.key, color: pl.style.getPropertyValue('--c'), num: $('.pl-num', pl) }));

  const frag = document.createDocumentFragment();
  const cells = [];
  practice.keys.forEach(({ key, color, num }) => {
    for (let i = 0; i < (+num.dataset.value || 0); i++) {
      const c = document.createElement('span');
      c.className = 'cell';
      c.dataset.key = key;
      c.style.setProperty('--c', color);
      frag.append(c);
      cells.push(c);
    }
  });
  matrix.replaceChildren(frag);

  const cols = +getComputedStyle(matrix).getPropertyValue('--cols') || 16;
  const rows = Math.ceil(cells.length / cols);
  practice.cells = cells.map((el, i) => {
    const r = Math.floor(i / cols); const c = i % cols;
    return { el, key: el.dataset.key, t: ((r + c) / (rows + cols - 2)) * .92 + Math.random() * .06, on: false, hot: false };
  });

  odo.dataset.value = cells.length;
  odo.setAttribute('aria-label', `${cells.length} problems solved`);
  odo.replaceChildren(...[...String(cells.length)].map(() => {
    const col = document.createElement('span');
    col.className = 'odo-col';
    col.innerHTML = Array.from({ length: 10 }, (_, d) => `<span>${d}</span>`).join('');
    return col;
  }));
  practice.cols = $$('.odo-col', odo);
  renderPractice(practice.p);
}

function renderPractice(p) {
  practice.p = p;
  const counts = {};
  let lit = 0;
  practice.cells.forEach((c) => {
    const on = c.t <= p;
    const hot = on && p < 1 && p - c.t < .035;
    if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
    if (hot !== c.hot) { c.hot = hot; c.el.classList.toggle('hot', hot); }
    if (on) { lit++; counts[c.key] = (counts[c.key] || 0) + 1; }
  });
  practice.keys.forEach(({ key, num }) => { num.textContent = counts[key] || 0; });
  const digits = String(lit).padStart(practice.cols.length, '0');
  const firstReal = digits.search(/[1-9]/);
  practice.cols.forEach((col, i) => {
    col.style.transform = `translateY(${-+digits[i] * 10}%)`;
    col.classList.toggle('is-lead', i < (firstReal < 0 ? digits.length - 1 : firstReal));
  });
  const count = $('.matrix-count');
  if (count) count.textContent = `${lit} / ${practice.cells.length}`;
}

function practiceScroll(pinned) {
  const state = { p: practice.p };
  const tween = gsap.to(state, {
    p: 1, ease: 'none', onUpdate: () => renderPractice(state.p),
    scrollTrigger: pinned
      ? { trigger: '.practice-pin', start: 'top top', end: '+=120%', pin: true, scrub: .5, anticipatePin: 1 }
      : { trigger: '.matrix', start: 'top 80%', end: 'bottom 50%', scrub: .5 },
  });
  return () => tween.scrollTrigger?.kill();
}

function practiceHover() {
  const matrix = $('.matrix');
  $$('.pl').forEach((pl) => {
    pl.addEventListener('pointerenter', () => { matrix.dataset.focus = pl.dataset.key; });
    pl.addEventListener('pointerleave', () => { delete matrix.dataset.focus; });
  });
}

/* =========================================================
   LIVE NUMBERS — GitHub profile stats + problem counts read
   from the practice repos. HTML values are the fallback; the
   result is cached for an hour to respect GitHub's rate limit.
   ========================================================= */
const GH = 'Uttkarshchambiyal';
const PRACTICE = {
  leetcode: { repo: 'LEET-CODE', count: (tree) => new Set(tree.filter((t) => /^solutions\/[^/]+\/.+\.(c|cpp|py|java)$/.test(t.path)).map((t) => t.path.split('/')[1])).size },
  hackerrank: { repo: 'hackerrank-c-solutions', count: (tree) => tree.filter((t) => /\.(c|cpp)$/.test(t.path)).length },
  codeforces: { repo: 'codeforces-problems', count: (tree) => tree.filter((t) => /\.(c|cpp)$/.test(t.path)).length },
  dsa: { repo: 'dsa-problem-solving-c', count: (tree) => tree.filter((t) => /\.(c|cpp)$/.test(t.path)).length },
};

async function loadLiveNumbers() {
  let data = null;
  try {
    const cached = JSON.parse(localStorage.getItem('live-numbers') || 'null');
    if (cached && Date.now() - cached.at < 3600e3) data = cached.data;
  } catch { /* storage blocked */ }

  if (!data) {
    const get = (url) => {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 6000);
      return fetch(url, { signal: ctrl.signal }).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    };
    const [user, repos, ...trees] = await Promise.all([
      get(`https://api.github.com/users/${GH}`),
      get(`https://api.github.com/users/${GH}/repos?per_page=100`),
      ...Object.values(PRACTICE).map((p) => get(`https://api.github.com/repos/${GH}/${p.repo}/git/trees/HEAD?recursive=1`)),
    ]);
    data = {};
    if (user) { data.repos = user.public_repos; data.followers = user.followers; }
    if (Array.isArray(repos)) {
      const own = repos.filter((r) => !r.fork);
      data.stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);
      data.deploys = own.filter((r) => /^https?:\/\//.test(r.homepage || '')).length;
    }
    Object.keys(PRACTICE).forEach((k, i) => { const t = trees[i]?.tree; if (Array.isArray(t)) data[k] = PRACTICE[k].count(t); });
    if (Object.keys(data).length) {
      try { localStorage.setItem('live-numbers', JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
    }
  }

  ['repos', 'followers', 'stars', 'deploys'].forEach((k) => {
    if (!(data[k] > 0)) return;
    $$(`[data-gh="${k}"]`).forEach((el) => { el.dataset.count = data[k]; if (el.dataset.done) el.textContent = data[k]; });
  });
  let changed = false;
  Object.keys(PRACTICE).forEach((k) => {
    const el = $(`[data-practice="${k}"]`);
    if (el && data[k] > 0 && +el.dataset.value !== data[k]) { el.dataset.value = data[k]; changed = true; }
  });
  if (changed) buildPractice();
}

// The résumé button appears only once public/resume.pdf exists
function showResumeIfPresent() {
  const btn = $('[data-resume]');
  if (!btn) return;
  fetch('/resume.pdf', { method: 'HEAD' })
    .then((r) => { if (r.ok && (r.headers.get('content-type') || '').includes('pdf')) btn.hidden = false; })
    .catch(() => {});
}

/* =========================================================
   BACKGROUNDS — raw WebGL
   1) one fixed canvas eases between each section's colours
      and draws slow, thin contour lines;
   2) the hero's own canvas: glowing lime contours that bend
      around the cursor.
   ========================================================= */
const THEMES = {
  paper: { bg: '#f3f2ea', ink: '#d6d5c8' },
  olive: { bg: '#282c20', ink: '#3c4131' },
  night: { bg: '#121310', ink: '#25281e' },
};
const hex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };

const NOISE = `
  vec2 hash(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return -1.0 + 2.0 * fract(sin(p) * 43758.5453123); }
  float noise(vec2 p) {
    const float K1 = 0.366025404; const float K2 = 0.211324865;
    vec2 i = floor(p + (p.x + p.y) * K1); vec2 a = p - i + (i.x + i.y) * K2;
    float m = step(a.y, a.x); vec2 o = vec2(m, 1.0 - m);
    vec2 b = a - o + K2; vec2 c = a - 1.0 + 2.0 * K2;
    vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
    vec3 n = h * h * h * h * vec3(dot(a, hash(i)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
    return dot(n, vec3(70.0));
  }`;
const VERT = 'attribute vec2 position; void main() { gl_Position = vec4(position, 0.0, 1.0); }';
const BG_FRAG = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse; uniform float uScroll; uniform vec3 uBg; uniform vec3 uInk;
  ${NOISE}
  float fbm(vec2 p) { float f = 0.0; float a = 0.5; for (int i = 0; i < 3; i++) { f += a * noise(p); p *= 2.0; a *= 0.5; } return f; }
  void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float d = length(p - m);
    float t = uTime * 0.015;
    float h = fbm(p * 0.75 + vec2(0.0, uScroll * 0.18) + vec2(t, -t * 0.6)) + exp(-d * d * 7.0) * 0.12;
    float bands = h * 4.5;
    float f = fract(bands);
    float w = fwidth(bands) * 1.1;
    float line = smoothstep(w, 0.0, f) + smoothstep(1.0 - w, 1.0, f);
    gl_FragColor = vec4(mix(uBg, uInk, clamp(line, 0.0, 1.0)), 1.0);
  }`;
const HERO_FRAG = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse;
  ${NOISE}
  float fbm(vec2 p) { float f = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { f += a * noise(p); p *= 2.02; a *= 0.5; } return f; }
  void main() {
    vec3 bg = vec3(0.953, 0.949, 0.918);
    vec3 ink = vec3(0.86, 0.855, 0.81);
    vec3 hot = vec3(0.62, 0.68, 0.30);
    vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
    vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    float t = uTime * 0.03;
    float d = length(p - m);
    vec2 q = p * 0.8;
    float h = fbm(q + vec2(t, -t * 0.7) + fbm(q * 1.4 - t) * 0.5) + exp(-d * d * 6.0) * 0.35;
    float bands = h * 5.0;
    float f = fract(bands);
    float w = fwidth(bands) * 0.9;
    float line = smoothstep(w, 0.0, f) + smoothstep(1.0 - w, 1.0, f);
    float near = exp(-d * d * 14.0);
    vec3 lc = mix(ink, hot, near * 0.8);
    vec3 col = mix(bg, lc, clamp(line * 0.9, 0.0, 1.0));
    gl_FragColor = vec4(col, 1.0);
  }`;

// compile a full-screen-triangle program; returns null when WebGL isn't usable
function glProgram(canvas, frag, uniforms) {
  const gl = canvas?.getContext('webgl', { antialias: false, alpha: false });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(uniforms.map((n) => [n, gl.getUniformLocation(prog, n)]));
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  const resize = () => {
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);
  return { gl, prog, U };
}

function initBackground() {
  const canvas = $('.bg-gl');
  const ctx = glProgram(canvas, BG_FRAG, ['uTime', 'uRes', 'uMouse', 'uScroll', 'uBg', 'uInk']);
  const sections = $$('[data-theme]');
  const header = $('.header');
  const footer = $('.footer');
  const footerCard = $('.footer-card');
  let target = THEMES.olive;

  // which theme sits under the middle of the screen; header text follows it
  const pick = () => {
    const mid = innerHeight * .5;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { target = THEMES[s.dataset.theme]; break; }
    }
    const card = footerCard.getBoundingClientRect();
    const overCard = card.top <= 40 && card.bottom >= 40;
    const overFrame = footer.getBoundingClientRect().top <= 60 && !overCard;
    header.classList.toggle('is-dark', overCard || (target !== THEMES.paper && !overFrame));
  };

  if (!ctx) {
    canvas?.remove();
    sections.forEach((s) => { s.style.background = THEMES[s.dataset.theme].bg; });
    gsap.ticker.add(pick);
    return;
  }

  const { gl, U } = ctx;
  const cur = { bg: hex(THEMES.olive.bg), ink: hex(THEMES.olive.ink) };
  const mouse = [.5, .5]; const goal = [.5, .5];
  addEventListener('pointermove', (e) => { goal[0] = e.clientX / innerWidth; goal[1] = 1 - e.clientY / innerHeight; });
  let time = 0; let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, .05); last = now;
    pick();
    const k = 1 - Math.pow(.004, dt);
    const tb = hex(target.bg); const ti = hex(target.ink);
    for (let i = 0; i < 3; i++) { cur.bg[i] += (tb[i] - cur.bg[i]) * k; cur.ink[i] += (ti[i] - cur.ink[i]) * k; }
    if (!REDUCED) time += dt;
    mouse[0] += (goal[0] - mouse[0]) * .05; mouse[1] += (goal[1] - mouse[1]) * .05;
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.uniform1f(U.uScroll, scrollY / innerHeight);
    gl.uniform3fv(U.uBg, cur.bg);
    gl.uniform3fv(U.uInk, cur.ink);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
}

function initHeroField() {
  const canvas = $('.hero-gl');
  const ctx = glProgram(canvas, HERO_FRAG, ['uTime', 'uRes', 'uMouse']);
  if (!ctx) { if (canvas) canvas.style.background = '#f3f2ea'; return; }
  const { gl, prog, U } = ctx;
  const mouse = [.5, .45]; const goal = [.5, .45];
  $('.hero').addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    goal[0] = (e.clientX - r.left) / r.width;
    goal[1] = 1 - (e.clientY - r.top) / r.height;
  });
  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
  let time = 0; let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, .05); last = now;
    if (!visible) return;
    if (!REDUCED) time += dt;
    mouse[0] += (goal[0] - mouse[0]) * .06; mouse[1] += (goal[1] - mouse[1]) * .06;
    gl.useProgram(prog);
    gl.uniform1f(U.uTime, time);
    gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  });
}

/* =========================================================
   PERSON FX — the portrait drawn through WebGL: a lime rim
   light traces the silhouette, and the cursor sends a soft
   liquid ripple with a slight colour split through the photo.
   The plain <img> stays underneath as the fallback.
   ========================================================= */
const PERSON_FRAG = `
  #extension GL_OES_standard_derivatives : enable
  precision highp float;
  uniform sampler2D uTex; uniform vec2 uRes; uniform vec2 uMouse; uniform float uTime; uniform float uHover; uniform float uAspect; uniform float uLens; uniform vec2 uTexel;
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    uv.y = 1.0 - uv.y;
    vec4 c = texture2D(uTex, uv);
    // unsharp mask at one source pixel, kept away from the silhouette edge
    vec4 n1 = texture2D(uTex, uv + vec2(uTexel.x, 0.0)); vec4 n2 = texture2D(uTex, uv - vec2(uTexel.x, 0.0));
    vec4 n3 = texture2D(uTex, uv + vec2(0.0, uTexel.y)); vec4 n4 = texture2D(uTex, uv - vec2(0.0, uTexel.y));
    float solid = smoothstep(0.92, 1.0, min(min(n1.a, n2.a), min(n3.a, n4.a)));
    vec3 base = c.rgb + (c.rgb - (n1.rgb + n2.rgb + n3.rgb + n4.rgb) * 0.25) * 0.8 * solid;
    // grade: a little more contrast, richer colour, slightly warm
    base = (base - 0.5) * 1.07 + 0.5;
    float g = dot(base, vec3(0.299, 0.587, 0.114));
    base = clamp(mix(vec3(g), base, 1.12) * vec3(1.015, 1.0, 0.965), 0.0, 1.0);
    vec2 d = uv - uMouse; d.x *= uAspect;
    float dist = length(d);
    float ang = atan(d.y, d.x);
    float edge = uLens * uHover * (1.0 + 0.05 * sin(ang * 5.0 + uTime * 1.4) + 0.035 * sin(ang * 3.0 - uTime * 0.9));
    float lens = smoothstep(edge, edge - 0.01, dist);
    // contour-map version of the photo: brightness drawn as moving lime isolines
    // soften the photo first so the isolines follow shapes, not grain
    vec2 px = 5.0 / uRes;
    vec3 s = c.rgb * 0.2;
    s += texture2D(uTex, uv + vec2(px.x, 0.0)).rgb * 0.1 + texture2D(uTex, uv - vec2(px.x, 0.0)).rgb * 0.1;
    s += texture2D(uTex, uv + vec2(0.0, px.y)).rgb * 0.1 + texture2D(uTex, uv - vec2(0.0, px.y)).rgb * 0.1;
    s += texture2D(uTex, uv + px).rgb * 0.1 + texture2D(uTex, uv - px).rgb * 0.1;
    s += texture2D(uTex, uv + vec2(px.x, -px.y)).rgb * 0.1 + texture2D(uTex, uv - vec2(px.x, -px.y)).rgb * 0.1;
    float lum = dot(s, vec3(0.299, 0.587, 0.114));
    float bands = lum * 8.0 - uTime * 0.35;
    float f = fract(bands);
    float w = fwidth(bands) * 1.1;
    float line = smoothstep(w, 0.0, f) + smoothstep(1.0 - w, 1.0, f);
    vec3 deep = vec3(0.157, 0.173, 0.125);
    vec3 lime = vec3(0.824, 1.0, 0.0);
    vec3 topo = mix(deep, lime, clamp(line * 0.9 + floor(lum * 8.0) / 8.0 * 0.16, 0.0, 1.0));
    vec3 col = mix(base, topo, lens);
    float ring = smoothstep(0.005, 0.0, abs(dist - edge)) * step(0.001, edge);
    col = mix(col, lime, ring * 0.9);
    gl_FragColor = vec4(col, c.a);
  }`;

function initPersonFX() {
  const photo = $('.hero-photo');
  const media = $('.hp-media');
  const img = $('.hp-base');
  if (!photo || !img) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hp-fx';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false, alpha: true, antialias: false });
  if (!gl || !gl.getExtension('OES_standard_derivatives')) return;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, PERSON_FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['uTex', 'uRes', 'uMouse', 'uTime', 'uHover', 'uAspect', 'uLens', 'uTexel'].map((n) => [n, gl.getUniformLocation(prog, n)]));

  const start = () => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.uniform1i(U.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    media.append(canvas);
    photo.classList.add('has-fx');

    const dpr = Math.min(devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = Math.round(media.clientWidth * dpr);
      canvas.height = Math.round(media.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uAspect, media.clientWidth / Math.max(1, media.clientHeight));
    };
    resize();
    addEventListener('resize', resize);

    gl.uniform1f(U.uLens, .2);
    gl.uniform2f(U.uTexel, 1 / img.naturalWidth, 1 / img.naturalHeight);
    const mouse = { x: .5, y: .3, hover: 0 };
    const goal = { x: .5, y: .3, hover: 0 };
    if (FINE && !REDUCED) {
      $('.hero').addEventListener('pointermove', (e) => {
        const r = media.getBoundingClientRect();
        goal.x = (e.clientX - r.left) / r.width;
        goal.y = (e.clientY - r.top) / r.height;
        goal.hover = 1;
      });
      $('.hero').addEventListener('pointerleave', () => { goal.hover = 0; });
    }
    let visible = true;
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
    let time = 0; let last = performance.now();
    gsap.ticker.add(() => {
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, .05); last = now;
      if (!visible) return;
      time += dt;
      mouse.x += (goal.x - mouse.x) * .08; mouse.y += (goal.y - mouse.y) * .08; mouse.hover += ((scrollY < innerHeight * .12 ? goal.hover : 0) - mouse.hover) * .07;
      gl.useProgram(prog);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uHover, mouse.hover);
      gl.uniform2f(U.uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  };
  if (img.complete && img.naturalWidth) start();
  else img.addEventListener('load', start, { once: true });
}
