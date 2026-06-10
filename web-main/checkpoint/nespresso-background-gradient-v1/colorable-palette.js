/* Colorable-style random accessible palettes (WCAG AA 4.5:1).
   Flowing left→right body gradient; palette crossfades every 10s.
   https://github.com/jxnblk/colorable */

const DEFAULT_BG = '#e5f000';
const DEFAULT_BG_END = '#d4f0c8';
const DEFAULT_TEXT = '#2e2e2e';
const DEFAULT_PASTEL_BG = '#e8d4f8';
const DEFAULT_PASTEL_BG_END = '#f8dce8';
const DEFAULT_PASTEL_TEXT = '#2a2438';
const MIN_CONTRAST = 4.5;
const MAX_ATTEMPTS = 64;
const STORAGE_KEY_MODE = 'portfolio-palette-mode';
const TRANSITION_MS = 10000;

let currentPalette = {
  bg: DEFAULT_BG,
  bgEnd: DEFAULT_BG_END,
  text: DEFAULT_TEXT,
};
let cycleTimer = null;

/** @returns {'default' | 'pastel'} */
function getPaletteMode() {
  const fromHtml = document.documentElement.getAttribute('data-palette');
  if (fromHtml === 'pastel' || fromHtml === 'default') return fromHtml;
  const stored = localStorage.getItem(STORAGE_KEY_MODE);
  if (stored === 'pastel' || stored === 'default') return stored;
  return 'default';
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const channel = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrastRatio(a, b) {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function hslToHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function randomHslComponent() {
  return {
    h: Math.random() * 360,
    s: Math.random(),
    l: Math.random() * 0.55 + 0.2,
  };
}

function randomHslEndFrom(base) {
  const hueOffset = 40 + Math.random() * 70;
  return {
    h: (base.h + hueOffset) % 360,
    s: Math.min(1, Math.max(0.15, base.s + (Math.random() * 0.2 - 0.1))),
    l: Math.min(0.9, Math.max(0.2, base.l + (Math.random() * 0.12 - 0.06))),
  };
}

/** Light, muted backgrounds for pastel mode */
function randomPastelBg() {
  return {
    h: Math.random() * 360,
    s: Math.random() * 0.32 + 0.18,
    l: Math.random() * 0.16 + 0.74,
  };
}

function randomPastelEndFrom(base) {
  const hueOffset = 55 + Math.random() * 75;
  return {
    h: (base.h + hueOffset) % 360,
    s: Math.min(0.55, Math.max(0.18, base.s + (Math.random() * 0.14 - 0.07))),
    l: Math.min(0.92, Math.max(0.72, base.l + (Math.random() * 0.1 - 0.05))),
  };
}

/** Dark text that contrasts on pastel backgrounds */
function randomPastelText() {
  return {
    h: Math.random() * 360,
    s: Math.random() * 0.45 + 0.15,
    l: Math.random() * 0.22 + 0.1,
  };
}

function pairFromBgStops(hexBg, hexEnd, hexText) {
  if (contrastRatio(hexBg, hexText) < MIN_CONTRAST) return null;
  if (contrastRatio(hexEnd, hexText) < MIN_CONTRAST) return null;
  return { bg: hexBg, bgEnd: hexEnd, text: hexText };
}

function generateAccessiblePair() {
  if (getPaletteMode() === 'pastel') {
    return generateAccessiblePastelPair();
  }

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const a = randomHslComponent();
    const b = randomHslComponent();
    const hexA = hslToHex(a.h, a.s, a.l);
    const hexB = hslToHex(b.h, b.s, b.l);

    if (contrastRatio(hexA, hexB) < MIN_CONTRAST) continue;

    if (relativeLuminance(hexA) >= relativeLuminance(hexB)) {
      const end = randomHslEndFrom(a);
      const pair = pairFromBgStops(
        hexA,
        hslToHex(end.h, end.s, end.l),
        hexB
      );
      if (pair) return pair;
    } else {
      const end = randomHslEndFrom(b);
      const pair = pairFromBgStops(
        hexB,
        hslToHex(end.h, end.s, end.l),
        hexA
      );
      if (pair) return pair;
    }
  }

  return { bg: DEFAULT_BG, bgEnd: DEFAULT_BG_END, text: DEFAULT_TEXT };
}

function generateAccessiblePastelPair() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const bg = randomPastelBg();
    const end = randomPastelEndFrom(bg);
    const text = randomPastelText();
    const pair = pairFromBgStops(
      hslToHex(bg.h, bg.s, bg.l),
      hslToHex(end.h, end.s, end.l),
      hslToHex(text.h, text.s, text.l)
    );
    if (pair) return pair;
  }

  return {
    bg: DEFAULT_PASTEL_BG,
    bgEnd: DEFAULT_PASTEL_BG_END,
    text: DEFAULT_PASTEL_TEXT,
  };
}

function timelineDashDataUrl(hex) {
  const fill = hex.replace('#', '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='4' height='14' viewBox='0 0 4 18'><rect x='0' y='0' width='4' height='15' rx='2' fill='%23${fill}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function syncPaintColors(text) {
  const root = document.documentElement;
  root.style.setProperty('--timeline-dash', timelineDashDataUrl(text));
  /* drop-shadow filters flicker when fed an interpolating --page-text */
  root.style.setProperty('--image-border', text);
  document.querySelectorAll('.timeline-header svg path').forEach((path) => {
    path.setAttribute('stroke', text);
  });
}

function applyPalette({ bg, bgEnd, text }, { instant = false } = {}) {
  const root = document.documentElement;

  if (instant) {
    root.classList.remove('palette-animate');
  }

  root.style.setProperty('--page-bg-start', bg);
  root.style.setProperty('--page-bg-end', bgEnd);
  root.style.setProperty('--page-text', text);
  currentPalette = { bg, bgEnd, text };

  if (instant) {
    syncPaintColors(text);
    requestAnimationFrame(() => root.classList.add('palette-animate'));
  }
}

function stopPaletteCycle() {
  if (cycleTimer !== null) {
    clearTimeout(cycleTimer);
    cycleTimer = null;
  }
}

/** CSS transitions handle interpolation; JS only sets targets every 10s */
function startPaletteCycle() {
  stopPaletteCycle();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  function next() {
    applyPalette(generateAccessiblePair());
    cycleTimer = setTimeout(next, TRANSITION_MS);
  }

  next();
}

/** @param {'default' | 'pastel'} mode */
function onPaletteTransitionEnd(e) {
  if (e.target !== document.documentElement || e.propertyName !== '--page-text') return;
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const text = style.getPropertyValue('--page-text').trim();
  syncPaintColors(text);
  currentPalette = {
    bg: style.getPropertyValue('--page-bg-start').trim(),
    bgEnd: style.getPropertyValue('--page-bg-end').trim(),
    text,
  };
}

function setPaletteMode(mode) {
  if (mode !== 'default' && mode !== 'pastel') return;
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  document.documentElement.setAttribute('data-palette', mode);
  stopPaletteCycle();
  const pair = generateAccessiblePair();
  applyPalette(pair, { instant: true });
  startPaletteCycle();
}

function initPalette() {
  const mode = getPaletteMode();
  document.documentElement.setAttribute('data-palette', mode);
  const pair = generateAccessiblePair();
  applyPalette(pair, { instant: true });
  document.documentElement.addEventListener('transitionend', onPaletteTransitionEnd);
  startPaletteCycle();
}

window.setPortfolioPaletteMode = setPaletteMode;
window.getPortfolioPaletteMode = getPaletteMode;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPalette);
} else {
  initPalette();
}
