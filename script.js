/* =========================================================
   UTTKARSH CHAMBIYAL — PORTFOLIO
   GSAP + ScrollTrigger for motion, Lenis for smooth scroll,
   raw WebGL for the contour-line backgrounds.
   ========================================================= */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import snapshot from './data/codolio.json';
import { CODOLIO_API, summarize } from './codolio.js';

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
  initLenis();

  const assets = Promise.allSettled([
    document.fonts?.ready,
    $('.hp-base')?.decode?.(),
  ]);
  let hero = null;
  const prepare = () => {
    // Compile shaders and measure scroll scenes while the loader holds still.
    mountSignatures();
    splitStatement();
    bootPractice();
    buildGraph();
    initClock();
    initUI();
    initMenu();
    initLinks();
    initBackground();
    initHeroField();
    initPersonFX();
    hero = intro(true);
    initScroll();
    ScrollTrigger.refresh();
  };
  runLoader(assets, prepare, () => hero?.play()).then(() => {
    document.body.classList.remove('is-loading');
    ScrollTrigger.refresh();
    lenis?.start();
    loadLiveNumbers();
  });
  window.addEventListener('load', () => {
    if (!document.body.classList.contains('is-loading')) ScrollTrigger.refresh();
  });
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
    tl.to(p, { autoRound: false, strokeDashoffset: 0, duration: duration * (lens[i] / total), ease: i === 0 ? 'power1.inOut' : 'power2.out' });
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
// The SVG mark has no font dependency. Setup happens during its still hold;
// only the two composited curtains move during the transition to the hero.
async function runLoader(assets, prepare, reveal) {
  const loader = $('.loader');
  const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  let timeout;
  const ready = Promise.race([
    Promise.resolve(assets).catch(() => {}),
    new Promise((r) => { timeout = setTimeout(r, 1800); }),
  ]).finally(() => clearTimeout(timeout));
  if (!loader || REDUCED) {
    await ready;
    prepare();
    loader?.remove();
    reveal();
    return;
  }

  // the U writes itself on like a signature
  const build = gsap.timeline({ paused: true })
    .fromTo('.loader-mark', { scale: .96 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0)
    .to('.loader-pen', { autoRound: false, strokeDashoffset: 0, duration: 1.4, ease: 'power1.inOut' }, .05)
    // then the pen sweeps a fine flourish underneath, as it would to finish a signature
    .to('.loader-swash', { autoRound: false, strokeDashoffset: 0, duration: .5, ease: 'power2.out' }, 1.35)
    .to({}, { duration: .25 });
  const built = new Promise((resolve) => build.eventCallback('onComplete', resolve));
  // start writing only once the first paint behind the cover has settled (max 0.4s)
  await Promise.race([ready, new Promise((r) => setTimeout(r, 400))]);
  await frames();
  build.play();

  await Promise.all([ready, built]);
  prepare();
  await frames();

  // exit: the U floats up and fades, then the cover slides up off the page
  const exit = gsap.timeline({ paused: true })
    .to('.loader-mark', { y: -30, opacity: 0, duration: .5, ease: 'power2.in' }, 0)
    .add(reveal, .45)
    .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut', force3D: true }, .15);
  await new Promise((resolve) => {
    exit.eventCallback('onComplete', resolve);
    exit.play();
  });
  loader.remove();
}

function intro(paused = false) {
  if (REDUCED) return null;
  return gsap.timeline({ paused, defaults: { ease: 'expo.out' } })
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
    $$('.ps-card').forEach(revealCard);
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
  fadeUp('.practice-cap, .practice-aside', .08);
  gsap.from('.heat-card', { y: 70, opacity: 0, rotateX: 14, transformPerspective: 1400, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.heat-card', start: 'top 96%' } });
  practiceCards();
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
      '--ix': () => `${size().x}px`, '--iy': () => `${size().y}px`,
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
    .to(sig[0], { autoRound: false, strokeDashoffset: 0, duration: .22 }, .6)
    .to(sig[1], { autoRound: false, strokeDashoffset: 0, duration: .08 }, .82)
    .to(sig[2], { autoRound: false, strokeDashoffset: 0, duration: .06 }, .9)
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
  $$('.tile-day-no, .tile-stat-num, .duo-name', track).forEach((el) => {
    gsap.fromTo(el, { xPercent: 12 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: el, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
  });
  // the giant years drift slower than the tiles, so they sit deep behind them
  $$('.hz-year', track).forEach((y) => {
    gsap.fromTo(y, { xPercent: 18 }, { xPercent: -42, ease: 'none', scrollTrigger: { trigger: y.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
  });
  // Claude × Codex: the names roll up out of their lines, the marks pop in
  const duo = $('.tile-duo', track);
  if (duo) {
    gsap.timeline({ scrollTrigger: { trigger: duo, containerAnimation: tween, start: 'left 80%' } })
      .from($$('.duo-line > span', duo), { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: .12 }, .2)
      .from($('.duo-x', duo), { rotation: -180, scale: 0, duration: .9, ease: 'back.out(2)' }, .45)
      .from($$('.duo-marks svg', duo), { scale: 0, rotation: -90, duration: .8, ease: 'back.out(2.2)', stagger: .1 }, .5)
      .from($('.duo-txt', duo), { opacity: 0, y: 12, duration: .7, ease: 'power3.out' }, .7);
  }
  // the git graph is drawn by the scroll: main runs left to right, each AI branch
  // splits off and merges back, and every commit pops in as the line reaches it
  const git = $('.git', track);
  if (git) {
    const W = 300;
    const at = (el, k = 'x') => +el.dataset[k] / W;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: git.closest('.tile'), containerAnimation: tween, start: 'left 88%', end: 'right 62%', scrub: .6 },
    });
    $$('.git-path', git).forEach((p) => {
      const from = p.dataset.from ? at(p, 'from') : 0;
      const to = p.dataset.to ? at(p, 'to') : 1;
      tl.fromTo(p, { strokeDasharray: '1 1', strokeDashoffset: 1 }, { autoRound: false, strokeDashoffset: 0, duration: to - from }, from);
    });
    $$('.git-dot, .git-badge, .git-head', git).forEach((el) => {
      tl.fromTo(el, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: .05, ease: 'back.out(3)' }, Math.max(0, at(el) - .02));
    });
    $$('.git-lbl[data-x]', git).forEach((el) => tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: .06 }, at(el)));
    tl.set({}, {}, 1);
  }

  tiltTiles();
}

// Tiles lean towards the pointer, with a soft light following it
function tiltTiles() {
  if (!FINE) return;
  $$('.hz-item .tile').forEach((t) => {
    gsap.set(t, { transformPerspective: 900 });
    const rx = gsap.quickTo(t, 'rotationX', { duration: .7, ease: 'power3' });
    const ry = gsap.quickTo(t, 'rotationY', { duration: .7, ease: 'power3' });
    t.addEventListener('pointermove', (e) => {
      const r = t.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      ry((x - .5) * 7);
      rx((.5 - y) * 7);
      t.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
      t.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
    });
    t.addEventListener('pointerleave', () => { rx(0); ry(0); });
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
    gsap.to($('.swoosh path', col), { autoRound: false, strokeDashoffset: 0, duration: .9, delay: .7, ease: 'power2.inOut', scrollTrigger: st });
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
   PRACTICE BOARD — live from Codolio. A rolling odometer over
   a year of practice: one scroll-driven progress value sweeps
   the calendar week by week and every counter follows it.
   Below, cards for platforms, difficulty, milestones, topics.
   The bundled snapshot paints first; live data replaces it.
   ========================================================= */
const practice = { data: null, p: 0, cells: [], cols: [], weeks: 0 };
const CODOLIO_CACHE = 'codolio-v1';
const DAY = 864e5;
const SVG_NS = 'http://www.w3.org/2000/svg';
const PLATFORM_COLORS = ['#d2ff00', '#e6e8d8', '#a9c25a', '#6f7d4c', '#8f927f', '#c9d98a'];
const DIFF_COLORS = { Easy: '#a9c25a', Medium: '#d2ff00', Hard: '#f3f2ea' };
const COUNT_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const ICONS = {
  trophy: '<path d="M7 4h10v4a5 5 0 0 1-10 0V4Z M7 6H4v1a3 3 0 0 0 3 3 M17 6h3v1a3 3 0 0 1-3 3 M12 13v4 M8 20h8"/>',
  badge: '<circle cx="12" cy="9" r="5"/><path d="M9 13.4 8 21l4-2 4 2-1-7.6"/>',
  cert: '<rect x="3.5" y="4.5" width="17" height="12" rx="1.5"/><path d="M7.5 9h9 M7.5 12h5"/><circle cx="16" cy="17.5" r="2.5"/>',
  code: '<path d="m8.5 8-4 4 4 4 M15.5 8l4 4-4 4 M13.5 6l-3 12"/>',
  flag: '<path d="M5.5 21V4 M5.5 4.5h11l-2.2 3.8 2.2 3.7h-11"/>',
};

const make = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const counter = (tag, cls, value) => { const n = make(tag, cls, value); n.dataset.num = value; return n; };
const isoDay = (t) => new Date(t).toISOString().slice(0, 10);

function getJSON(url, ms = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .finally(() => clearTimeout(timer));
}

function bootPractice() {
  if (!$('.practice')) return;
  let data = snapshot;
  let fresh = false;
  try {
    const cached = JSON.parse(localStorage.getItem(CODOLIO_CACHE) || 'null');
    if (cached?.data?.total > 0 && Date.now() - cached.at < 3600e3) { data = cached.data; fresh = true; }
  } catch { /* storage blocked */ }
  setPractice(data);
  heatTip();
  if (!fresh) refreshCodolio();

  // the calendar shows as many weeks as fit; rebuild when that changes
  let timer = 0;
  addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(() => { if (heatWeeks() !== practice.weeks) { buildHeat(); renderPractice(practice.p); } }, 200);
  });
}

async function refreshCodolio() {
  const json = await getJSON(CODOLIO_API, 8000);
  const data = json && summarize(json);
  if (!data) return;
  try { localStorage.setItem(CODOLIO_CACHE, JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
  if (JSON.stringify(data) === JSON.stringify(practice.data)) return;
  setPractice(data);
  ScrollTrigger.refresh();
}

function setPractice(data) {
  practice.data = data;
  const shown = data.platforms.filter((p) => p.solved > 0);
  $$('[data-codolio="total"]').forEach((el) => { el.textContent = data.total; });
  const words = $('[data-codolio="platforms"]');
  if (words) words.textContent = `${COUNT_WORDS[shown.length] || shown.length} platform${shown.length === 1 ? '' : 's'}`;
  buildOdo(data.total);
  buildHeat();
  renderPlatforms(shown);
  renderDifficulty(data.difficulty);
  renderMilestones(data);
  renderTopics(data.topics);
  renderPractice(practice.p);
}

function buildOdo(total) {
  const odo = $('.odo');
  if (!odo) return;
  odo.setAttribute('aria-label', `${total} problems solved`);
  const n = String(total).length;
  if (practice.cols.length === n) return;
  odo.replaceChildren(...Array.from({ length: n }, () => {
    const col = make('span', 'odo-col');
    for (let d = 0; d < 10; d++) col.append(make('span', '', d));
    return col;
  }));
  practice.cols = $$('.odo-col', odo);
}

function heatWeeks() {
  const w = $('.heat-grid')?.clientWidth || 0;
  return Math.max(16, Math.min(53, Math.floor(w / 13)));
}

// One column per week (Monday on top), ending today. Levels are
// quartiles of the visible days, so a light week still reads.
function buildHeat() {
  const grid = $('.heat-grid');
  const months = $('.heat-months');
  if (!grid || !practice.data) return;
  const weeks = heatWeeks();
  practice.weeks = weeks;
  const cal = practice.data.calendar || {};
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = today - (((new Date(today).getUTCDay() + 6) % 7) + (weeks - 1) * 7) * DAY;

  const seen = [];
  for (let t = start; t <= today; t += DAY) if (cal[isoDay(t)]) seen.push(cal[isoDay(t)]);
  seen.sort((a, b) => a - b);
  const q = (f) => seen[Math.min(seen.length - 1, Math.floor(f * seen.length))] || 0;
  const cut = [q(.25), q(.5), q(.75)];
  const level = (c) => (!c ? 0 : c <= cut[0] ? 1 : c <= cut[1] ? 2 : c <= cut[2] ? 3 : 4);

  const frag = document.createDocumentFragment();
  const cells = [];
  const span = weeks - 1 + 6 * .3;
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const t = start + (w * 7 + d) * DAY;
      const el = make('i', 'hc');
      frag.append(el);
      if (t > today) { el.classList.add('is-future'); continue; }
      const c = cal[isoDay(t)] || 0;
      el.dataset.l = level(c);
      el.dataset.t = t;
      el.dataset.c = c;
      cells.push({ el, c, t: ((w + d * .3) / span) * .94, on: false, hot: false });
    }
  }
  grid.style.setProperty('--weeks', weeks);
  grid.replaceChildren(frag);
  practice.cells = cells;

  if (months) {
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
    const marks = [];
    for (let w = 0; w < weeks; w++) {
      const t = start + w * 7 * DAY;
      if (w === 0 || new Date(t).getUTCMonth() !== new Date(t - 7 * DAY).getUTCMonth()) marks.push([w, t]);
    }
    if (marks.length > 1 && marks[1][0] < 3) marks.shift();
    months.style.setProperty('--weeks', weeks);
    months.replaceChildren(...marks.map(([w, t]) => {
      const s = make('span', '', fmt.format(t));
      s.style.gridColumnStart = w + 1;
      return s;
    }));
  }

  const range = $('[data-codolio="range"]');
  if (range) {
    const m = Math.round(weeks / 4.35);
    range.textContent = m >= 12 ? 'Last 12 months · every platform' : `Last ${m} months`;
  }
}

function renderPractice(p) {
  practice.p = p;
  let days = 0; let subs = 0; let allDays = 0; let allSubs = 0;
  practice.cells.forEach((c) => {
    const on = p > 0 && c.t <= p;
    const hot = on && c.c > 0 && p < 1 && p - c.t < .03;
    if (on !== c.on) { c.on = on; c.el.classList.toggle('on', on); }
    if (hot !== c.hot) { c.hot = hot; c.el.classList.toggle('hot', hot); }
    if (c.c) { allDays++; allSubs += c.c; if (on) { days++; subs += c.c; } }
  });
  const d = practice.data;
  if (!d) return;
  // counters climb with the calendar, so busy months move them faster
  const fs = allSubs ? subs / allSubs : p;
  const fd = allDays ? days / allDays : p;
  setOdo(Math.round(d.total * fs));
  const put = (k, v) => { const el = $(`[data-heat="${k}"]`); if (el) el.textContent = v; };
  put('days', Math.round(d.activeDays * fd));
  put('subs', Math.round(d.submissions * fs));
  put('streak', Math.round(d.maxStreak * fd));
}

function setOdo(n) {
  const digits = String(n).padStart(practice.cols.length, '0');
  const firstReal = digits.search(/[1-9]/);
  practice.cols.forEach((col, i) => {
    col.style.transform = `translateY(${-+digits[i] * 10}%)`;
    col.classList.toggle('is-lead', i < (firstReal < 0 ? digits.length - 1 : firstReal));
  });
}

function practiceScroll(pinned) {
  const state = { p: practice.p };
  const draw = () => renderPractice(state.p);
  // Pinned (big screens): the year fills in as you scroll through the pin.
  // Unpinned (phones, tablets, short windows): the counter and calendar sit on
  // screen together, so the fill plays once by itself and always lands on the full total.
  const tween = pinned
    ? gsap.to(state, {
      p: 1, ease: 'none', onUpdate: draw,
      scrollTrigger: { trigger: '.practice-pin', start: 'top top', end: '+=110%', pin: true, scrub: .5, anticipatePin: 1 },
    })
    : gsap.to(state, {
      p: 1, duration: 2.4, ease: 'power2.inOut', onUpdate: draw,
      scrollTrigger: { trigger: '.heat-card', start: 'top 92%', once: true },
    });
  return () => { tween.scrollTrigger?.kill(); tween.kill(); };
}

function heatTip() {
  const grid = $('.heat-grid');
  const tip = $('.heat-tip');
  const card = $('.heat-card');
  if (!grid || !tip || !card || !FINE) return;
  const fmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  grid.addEventListener('pointerover', (e) => {
    const c = e.target.closest('.hc[data-t]');
    if (!c) return;
    const n = +c.dataset.c;
    tip.replaceChildren(make('b', '', n ? `${n} submission${n === 1 ? '' : 's'}` : 'No submissions'), make('span', '', fmt.format(+c.dataset.t)));
    const r = c.getBoundingClientRect();
    const k = card.getBoundingClientRect();
    const half = tip.offsetWidth / 2 + 12;
    tip.style.left = `${Math.min(k.width - half, Math.max(half, r.left - k.left + r.width / 2))}px`;
    tip.style.top = `${r.top - k.top}px`;
    tip.classList.add('is-on');
  });
  grid.addEventListener('pointerleave', () => tip.classList.remove('is-on'));
}

function renderPlatforms(list) {
  const bar = $('.split-bar');
  const ul = $('.plat-list');
  if (!bar || !ul) return;
  const total = list.reduce((s, p) => s + p.solved, 0) || 1;
  const focus = (key) => {
    bar.classList.toggle('has-focus', !!key);
    $$('.seg', bar).forEach((s) => s.classList.toggle('is-focus', s.dataset.key === key));
  };
  bar.replaceChildren(...list.map((p, i) => {
    const s = make('span', 'seg');
    s.dataset.key = p.key;
    s.style.cssText = `--v:${p.solved};--c:${PLATFORM_COLORS[i % PLATFORM_COLORS.length]};--i:${i}`;
    return s;
  }));
  ul.replaceChildren(...list.map((p, i) => {
    const a = make('a', 'plat');
    a.href = p.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.style.setProperty('--c', PLATFORM_COLORS[i % PLATFORM_COLORS.length]);
    a.setAttribute('aria-label', `${p.name}: ${p.solved} problems solved. Open profile`);
    const name = make('span', 'plat-name');
    name.append(make('b', '', p.name));
    if (p.handle) name.append(make('small', '', `@${p.handle}`));
    a.append(make('i', 'plat-chip'), name, make('span', 'plat-share', `${Math.round((p.solved / total) * 100)}%`), counter('b', 'plat-num', p.solved), make('span', 'plat-go', '↗'));
    a.addEventListener('pointerenter', () => focus(p.key));
    a.addEventListener('pointerleave', () => focus(null));
    const li = make('li');
    li.append(a);
    return li;
  }));
}

function renderDifficulty(d) {
  const segs = [['Easy', d.easy], ['Medium', d.medium], ['Hard', d.hard]].filter(([, v]) => v > 0);
  const dsa = segs.reduce((s, [, v]) => s + v, 0);
  const C = 2 * Math.PI * 50;
  const gap = segs.length > 1 ? 2.4 : 0;
  let off = 0;
  $('.donut-segs')?.replaceChildren(...segs.map(([name, v], i) => {
    const c = document.createElementNS(SVG_NS, 'circle');
    Object.entries({ cx: 60, cy: 60, r: 50, fill: 'none', 'stroke-width': 11, class: 'donut-seg', 'stroke-dashoffset': (-off).toFixed(2) })
      .forEach(([k, val]) => c.setAttribute(k, val));
    c.style.cssText = `--len:${Math.max(.5, (v / dsa) * C - gap).toFixed(2)};--c:${DIFF_COLORS[name]};--i:${i}`;
    off += (v / dsa) * C;
    return c;
  }));
  const mid = $('.donut-mid b');
  if (mid) { mid.textContent = dsa; mid.dataset.num = dsa; }

  $('.diff-legend')?.replaceChildren(...segs.map(([name, v]) => {
    const li = make('li');
    li.style.setProperty('--c', DIFF_COLORS[name]);
    li.append(make('i'), make('span', 'diff-name', name), counter('b', 'diff-num', v), make('em', 'diff-pct', `${Math.round((v / dsa) * 100)}%`));
    return li;
  }));

  const extra = [
    ['Fundamentals', d.fundamentals, d.fundamentalsFrom],
    ['Competitive', d.competitive, d.competitiveFrom],
  ].filter(([, v]) => v > 0);
  $('.diff-extra')?.replaceChildren(...extra.map(([name, v, from]) => {
    const box = make('div', 'diff-x');
    box.append(counter('b', '', v), make('span', 'caption', name), make('small', '', (from || []).join(' · ')));
    return box;
  }));
}

function renderMilestones(d) {
  const ul = $('.ms-list');
  if (!ul) return;
  const items = [];
  if (d.contests) items.push(['trophy', `${d.contests === 1 ? 'Contest' : 'Contests'} entered`, `On ${d.contestsOn.join(' & ')}`, d.contests]);
  d.badges.forEach((b) => items.push(['badge', b.name, `${b.platform} badge`]));
  d.certificates.forEach((c) => items.push(['cert', c.name, `${c.platform} certificate`]));
  if (d.languages.length) items.push(['code', d.languages.join(' · '), 'Languages I solve in']);
  if (d.firstDay) {
    const since = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(Date.parse(d.firstDay));
    items.push(['flag', `Since ${since}`, 'First tracked submission']);
  }
  ul.replaceChildren(...items.slice(0, 6).map(([icon, title, sub, value]) => {
    const li = make('li', 'ms');
    const ic = make('span', 'ms-icon');
    ic.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[icon]}</svg>`;
    const txt = make('span', 'ms-txt');
    txt.append(make('b', '', title), make('span', '', sub));
    li.append(ic, txt);
    if (value !== undefined) li.append(counter('span', 'ms-val', value));
    return li;
  }));
}

function renderTopics(topics) {
  const ol = $('.topics');
  if (!ol) return;
  const top = topics.slice(0, 8);
  const max = top[0]?.[1] || 1;
  const meta = $('[data-codolio="topics"]');
  if (meta) meta.textContent = `${topics.length} topics covered`;
  ol.replaceChildren(...top.map(([name, n], i) => {
    const li = make('li', 'tp');
    li.style.cssText = `--w:${(n / max).toFixed(3)};--i:${i}`;
    const bar = make('span', 'tp-bar');
    bar.append(make('i'));
    li.append(make('span', 'tp-name', name), bar, counter('b', 'tp-num', n));
    return li;
  }));
}

// Cards draw their bars and count their numbers the first time they show
function revealCard(card) {
  if (card.classList.contains('is-in')) return;
  card.classList.add('is-in');
  if (REDUCED) return;
  $$('[data-num]', card).forEach((el) => {
    const to = +el.dataset.num || 0;
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.8, ease: 'expo.out', onUpdate: () => { el.textContent = Math.round(o.v); } });
  });
}

function practiceCards() {
  $$('.ps-bento .ps-card').forEach((card, i) => {
    gsap.from(card, { y: 90, opacity: 0, duration: 1.4, ease: 'expo.out', delay: (i % 2) * .1, scrollTrigger: { trigger: card, start: 'top 92%' } });
    ScrollTrigger.create({ trigger: card, start: 'top 78%', once: true, onEnter: () => revealCard(card) });
  });
}

/* =========================================================
   LIVE NUMBERS — GitHub profile stats. HTML values are the
   fallback; the result is cached for an hour to respect
   GitHub's rate limit.
   ========================================================= */
const GH = 'Uttkarshchambiyal';

async function loadLiveNumbers() {
  let data = null;
  try {
    const cached = JSON.parse(localStorage.getItem('live-numbers') || 'null');
    if (cached && Date.now() - cached.at < 3600e3) data = cached.data;
  } catch { /* storage blocked */ }

  if (!data) {
    const [user, repos] = await Promise.all([
      getJSON(`https://api.github.com/users/${GH}`),
      getJSON(`https://api.github.com/users/${GH}/repos?per_page=100`),
    ]);
    data = {};
    if (user) { data.repos = user.public_repos; data.followers = user.followers; }
    if (Array.isArray(repos)) {
      const own = repos.filter((r) => !r.fork);
      data.stars = own.reduce((s, r) => s + (r.stargazers_count || 0), 0);
      data.deploys = own.filter((r) => /^https?:\/\//.test(r.homepage || '')).length;
    }
    if (Object.keys(data).length) {
      try { localStorage.setItem('live-numbers', JSON.stringify({ at: Date.now(), data })); } catch { /* ignore */ }
    }
  }

  ['repos', 'followers', 'stars', 'deploys'].forEach((k) => {
    if (!(data[k] > 0)) return;
    $$(`[data-gh="${k}"]`).forEach((el) => { el.dataset.count = data[k]; if (el.dataset.done) el.textContent = data[k]; });
  });
}

// The résumé button appears only once public/resume.pdf exists

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
  const hero = $('.hero');
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
    // if the GPU drops the context, show the plain image again
    canvas.addEventListener('webglcontextlost', () => photo.classList.remove('has-fx'));

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
      if (!visible || gl.isContextLost() || hero.dataset.theme === 'olive') return;
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
