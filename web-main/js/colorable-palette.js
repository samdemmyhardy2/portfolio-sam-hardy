/* Colorable-style random accessible palettes (WCAG AA 4.5:1).
   https://github.com/jxnblk/colorable */

const DEFAULT_BG = '#e5f000';
const DEFAULT_TEXT = '#2e2e2e';
const MIN_CONTRAST = 4.5;
const MAX_ATTEMPTS = 64;

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

function generateAccessiblePair() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const a = randomHslComponent();
    const b = randomHslComponent();
    const hexA = hslToHex(a.h, a.s, a.l);
    const hexB = hslToHex(b.h, b.s, b.l);

    if (contrastRatio(hexA, hexB) < MIN_CONTRAST) continue;

    if (relativeLuminance(hexA) >= relativeLuminance(hexB)) {
      return { bg: hexA, text: hexB };
    }
    return { bg: hexB, text: hexA };
  }

  return { bg: DEFAULT_BG, text: DEFAULT_TEXT };
}

function timelineDashDataUrl(hex) {
  const fill = hex.replace('#', '');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='4' height='14' viewBox='0 0 4 18'><rect x='0' y='0' width='4' height='15' rx='2' fill='%23${fill}'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

function applyPalette({ bg, text }) {
  const root = document.documentElement;
  root.style.setProperty('--page-bg', bg);
  root.style.setProperty('--page-text', text);
  root.style.setProperty('--timeline-dash', timelineDashDataUrl(text));

  document.querySelectorAll('.timeline-header svg path').forEach((path) => {
    path.setAttribute('stroke', text);
  });
}

function randomizePalette() {
  applyPalette(generateAccessiblePair());
}

function initPalette() {
  randomizePalette();

  document.addEventListener(
    'click',
    () => {
      randomizePalette();
    },
    true
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPalette);
} else {
  initPalette();
}
