/* =========================================================
   Hero header: fit-to-width + word-by-word staggered reveal,
   plus click -> stagger-out -> navigate -> stagger-in.
   Mirrors the behaviour of the original Next.js site:
   each word is its own reveal unit, revealed in a single
   random order per hero block, one per frame-tick.
   ========================================================= */

/* Pace controls (frames between each word). Lower = faster.
   The original site used 1 (every frame). */
const REVEAL_FRAMES = 1; // speed of words appearing
const HIDE_FRAMES = 1;   // speed of words disappearing on click

/* Mark that JS is active immediately, so CSS hides the header for the
   intro animation. If this script never runs, the header stays visible. */
document.documentElement.classList.add('js-anim');

function isHomeMobileNavActive() {
  return (
    window.matchMedia('(max-width: 679px)').matches &&
    !!document.getElementById('hero-mobile-nav-art')
  );
}

function isCaseMobileNavActive() {
  return (
    window.matchMedia('(max-width: 679px)').matches &&
    !!document.querySelector('#hero-principal .hero-mobile-case-nav')
  );
}

function isMobilePrincipalHeroSkipped(section) {
  if (section.id === 'hero-home' && isHomeMobileNavActive()) return true;
  if (section.id === 'hero-principal' && isCaseMobileNavActive()) return true;
  return false;
}

/* ---- Fit each hero row so type fills the nav frame left → right ----
   Matches Next.js FitLine: targetFill + slight overshoot before rounding. */
/* Load Figma SVG exports into vector hero rows before fit/reveal. */
async function hydrateSvgUnit(el, svgClass) {
  if (el.dataset.hydrated === '1' || el.querySelector('svg')) return;

  const url = el.getAttribute('data-hero-svg');
  if (!url) return;

  try {
    const res = await fetch(url);
    if (!res.ok) return;

    el.innerHTML = await res.text();
    const svg = el.querySelector('svg');
    if (svg) svg.classList.add(svgClass);

    if (el.dataset.vbWidth) {
      const flex = `${el.dataset.vbWidth} 1 0`;
      el.style.flex = flex;
      const link = el.closest('a');
      if (link?.parentElement?.classList.contains('hero-row-vector-links')) {
        link.style.flex = flex;
      }
    }

    el.dataset.hydrated = '1';
  } catch (_) {
    /* leave empty if fetch fails */
  }
}

async function hydrateHeroVectors() {
  const skipHome = isHomeMobileNavActive();
  const skipCasePrincipal = isCaseMobileNavActive();
  const jobs = [];

  document
    .querySelectorAll('.hero-vector-reveal[data-hero-svg]')
    .forEach((el) => {
      if (skipHome && el.closest('#hero-home') && !el.closest('.hero-mobile-nav')) return;
      if (skipCasePrincipal && el.closest('#hero-principal > .hero-row')) return;
      jobs.push(hydrateSvgUnit(el, 'hero-word-svg'));
    });

  document.querySelectorAll('.hero-row-vector[data-hero-svg]').forEach((row) => {
    if (skipHome && row.closest('#hero-home') && !row.classList.contains('hero-mobile-nav')) return;
    if (skipCasePrincipal && row.closest('#hero-principal > .hero-row')) return;
    if (row.classList.contains('hero-row-vector-words')) return;

    const link = row.querySelector('a');
    if (!link || link.querySelector('.hero-vector-reveal')) return;

    jobs.push(
      (async () => {
        const wrap = document.createElement('span');
        wrap.className = 'ru hero-vector-reveal';
        wrap.setAttribute('data-hero-svg', row.getAttribute('data-hero-svg'));
        link.appendChild(wrap);
        await hydrateSvgUnit(wrap, 'hero-line-svg');
        row.dataset.hydrated = '1';
      })()
    );
  });

  await Promise.all(jobs);
}

function fitHeroRows() {
  const rows = document.querySelectorAll('.hero-row');

  rows.forEach((row) => {
    if (isHomeMobileNavActive() && row.closest('#hero-home')) return;
    if (isCaseMobileNavActive() && row.closest('#hero-principal > .hero-row')) return;
    if (row.classList.contains('hero-row-vector')) return;

    const section = row.parentElement;
    if (!section) return;

    const rowStyle = getComputedStyle(row);
    const padX =
      parseFloat(rowStyle.paddingLeft) + parseFloat(rowStyle.paddingRight);
    const availableWidth = row.clientWidth - padX;
    if (!availableWidth) return;

    const targetFill = 1.005;
    const targetWidth = availableWidth * targetFill;
    const maxPx = row.classList.contains('hero-row-contact') ? 70 : 400;

    let lo = 10;
    let hi = maxPx;
    let best = 10;

    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      row.style.fontSize = mid + 'px';

      if (row.scrollWidth <= targetWidth) {
        best = mid;
        lo = mid;
      } else {
        hi = mid;
      }
    }

    let px = Math.min(best * 1.01, maxPx);
    row.style.fontSize = px + 'px';

    if (row.scrollWidth > availableWidth) {
      row.style.fontSize = best + 'px';
    }

  });
}

/* ---- Helpers ---- */
function shuffle(list) {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isVisibleSection(section) {
  return getComputedStyle(section).display !== 'none';
}

/* Split each link's text spans into per-word units (<span class="ru">),
   so words can be revealed individually. Returns the unit elements. */
function buildWordUnits(section) {
  const units = [];

  section.querySelectorAll('.hero-link-big, .hero-link-small').forEach((link) => {
    const vectorUnits = link.querySelectorAll(':scope > .hero-vector-reveal');
    if (vectorUnits.length) {
      vectorUnits.forEach((u) => units.push(u));
      return;
    }

    const vectorUnit = link.querySelector('.hero-vector-reveal');
    if (vectorUnit) {
      units.push(vectorUnit);
      return;
    }

    link.querySelectorAll('.titlefont, .titleslashfont').forEach((span) => {
      if (span.dataset.split === '1') {
        span.querySelectorAll('.ru').forEach((u) => units.push(u));
        return;
      }

      const text = span.textContent;
      span.textContent = '';
      span.dataset.split = '1';

      // Keep whitespace as plain text; wrap each word in a reveal unit.
      text.split(/(\s+)/).forEach((part) => {
        if (part === '') return;
        if (/^\s+$/.test(part)) {
          span.appendChild(document.createTextNode(part));
          return;
        }
        const unit = document.createElement('span');
        unit.className = 'ru';
        unit.textContent = part;
        span.appendChild(unit);
        units.push(unit);
      });
    });
  });

  return units;
}

/* Reveal a list of units one-by-one in random order. */
function revealUnits(units, framesBetween, onDone) {
  const order = shuffle(units);
  let index = 0;
  let frame = 0;

  function step() {
    frame++;
    if (frame >= framesBetween) {
      if (index < order.length) {
        order[index].classList.add('show');
        index++;
      }
      frame = 0;
    }
    if (index < order.length) {
      requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

/* Hide a list of units one-by-one in random order. */
function hideUnits(units, framesBetween, onDone) {
  const order = shuffle(units);
  let index = 0;
  let frame = 0;

  function step() {
    frame++;
    if (frame >= framesBetween) {
      if (index < order.length) {
        order[index].classList.remove('show');
        index++;
      }
      frame = 0;
    }
    if (index < order.length) {
      requestAnimationFrame(step);
    } else if (onDone) {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

/* Collect currently-visible word units across all visible hero blocks. */
function getVisibleUnits() {
  const units = [];
  document.querySelectorAll('.hero').forEach((section) => {
    if (!isVisibleSection(section)) return;
    section.querySelectorAll('.ru').forEach((u) => units.push(u));
  });
  return units;
}

/* A link actually navigates only if it points to a real page. */
function isNavigable(a) {
  const href = a.getAttribute('href');
  return !!href && href !== '#' && !href.startsWith('#');
}

/* Grouped phrase hover — data-hover-group on links, layout unchanged. */
function wireHeroHoverGroups() {
  document.querySelectorAll('.hero-row-vector-links').forEach((row) => {
    row.addEventListener('mouseover', (e) => {
      const link = e.target.closest('a[data-hover-group]');
      if (!link || !row.contains(link)) return;

      const group = link.dataset.hoverGroup;
      row.querySelectorAll(`a[data-hover-group="${group}"]`).forEach((a) => {
        a.classList.add('hero-hover-group-lit');
      });
    });

    row.addEventListener('mouseout', (e) => {
      const link = e.target.closest('a[data-hover-group]');
      if (!link || !row.contains(link)) return;

      const group = link.dataset.hoverGroup;
      const to = e.relatedTarget;
      if (to && row.contains(to)) {
        if (to.closest && to.closest(`a[data-hover-group="${group}"]`)) return;
        if (to.closest && !to.closest('a[data-hover-group]')) return;
      }

      row.querySelectorAll(`a[data-hover-group="${group}"]`).forEach((a) => {
        a.classList.remove('hero-hover-group-lit');
      });
    });

    row.addEventListener('mouseleave', () => {
      row.querySelectorAll('a.hero-hover-group-lit').forEach((a) => {
        a.classList.remove('hero-hover-group-lit');
      });
    });
  });
}

wireHeroHoverGroups();

/* ---- On load: fit, build word units, then stagger them in ---- */
let introStarted = false;
async function startIntro() {
  if (introStarted) return;
  introStarted = true;

  await hydrateHeroVectors();
  fitHeroRows();

  if (isCaseMobileNavActive()) {
    const principal = document.getElementById('hero-principal');
    if (principal) {
      principal
        .querySelectorAll('.hero-mobile-case-nav .hero-link-big, .hero-mobile-case-nav .hero-link-small')
        .forEach((link) => link.classList.add('lit'));
      principal.querySelectorAll('.hero-mobile-case-nav .ru').forEach((u) => u.classList.add('show'));
    }
  }

  // Each visible hero block reveals as its own tight group (header,
  // footer nav, etc. don't dilute each other).
  document.querySelectorAll('.hero').forEach((section) => {
    if (!isVisibleSection(section)) return;
    if (isMobilePrincipalHeroSkipped(section)) return;
    const units = buildWordUnits(section);
    section
      .querySelectorAll('.hero-link-big, .hero-link-small')
      .forEach((link) => link.classList.add('lit'));
    revealUnits(units, REVEAL_FRAMES);
  });
}

/* Prefer running once fonts are ready (so widths are correct)... */
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(startIntro);
}
/* ...but never leave the page blank: reveal anyway as a fallback. */
window.addEventListener('load', startIntro);
setTimeout(startIntro, 1500);

window.addEventListener('resize', () => {
  fitHeroRows();
  if (!isHomeMobileNavActive()) ensureHomeDesktopHero();
  if (!isCaseMobileNavActive()) ensureCaseDesktopPrincipal();
});

async function ensureHomeDesktopHero() {
  const section = document.getElementById('hero-home');
  if (!section) return;

  const pending = section.querySelector(
    '.hero-vector-reveal[data-hero-svg]:not([data-hydrated="1"]), .hero-row-vector[data-hero-svg]:not([data-hydrated="1"])'
  );
  if (pending) await hydrateHeroVectors();

  fitHeroRows();
  section.querySelectorAll('.hero-link-big, .hero-link-small').forEach((link) => {
    link.classList.add('lit');
  });
  buildWordUnits(section).forEach((u) => u.classList.add('show'));
}

async function ensureCaseDesktopPrincipal() {
  const section = document.getElementById('hero-principal');
  if (!section) return;

  const pending = section.querySelector(
    '.hero-row .hero-vector-reveal[data-hero-svg]:not([data-hydrated="1"])'
  );
  if (pending) await hydrateHeroVectors();

  fitHeroRows();
  section.querySelectorAll('.hero-link-big, .hero-link-small').forEach((link) => {
    link.classList.add('lit');
  });
  buildWordUnits(section).forEach((u) => u.classList.add('show'));
}

/* Returning via the browser Back/Forward cache: show the header fully. */
window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    document
      .querySelectorAll('.hero-link-big, .hero-link-small')
      .forEach((link) => link.classList.add('lit'));
    getVisibleUnits().forEach((u) => u.classList.add('show'));
  }
});

/* ---- Click: stagger the whole header out, then navigate ---- */
let isTransitioning = false;

document.addEventListener('click', (e) => {
  const link = e.target.closest('a');
  if (!link) return;

  const isHeroLink =
    link.classList.contains('hero-link-big') ||
    link.classList.contains('hero-link-small');
  if (!isHeroLink) return;

  // Non-navigable links (href="#") do nothing.
  if (!isNavigable(link)) {
    e.preventDefault();
    return;
  }

  e.preventDefault();
  if (isTransitioning) return;
  isTransitioning = true;

  const destination = link.href;

  hideUnits(getVisibleUnits(), HIDE_FRAMES, () => {
    window.location.href = destination;
  });
});
