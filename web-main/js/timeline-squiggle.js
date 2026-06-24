/**
 * Squiggle scroll paint — paint head stays at viewport centre.
 * Path split into before / loop / after branches; pick closest-to-centre
 * per branch, switch branch only when clearly better (stops loop flicker).
 * Supports multiple [data-squiggle-path] per timeline (one host + track each).
 */
(function () {
  const timeline = document.querySelector('[data-squiggle-timeline]');
  if (!timeline) return;

  const paths = timeline.querySelectorAll('[data-squiggle-path]');
  if (!paths.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const painters = [];
  let ticking = false;

  paths.forEach((path) => {
    painters.push(createPainter(path, timeline));
  });

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      painters.forEach((p) => p.updatePaint());
      ticking = false;
    });
  }

  function measureAll() {
    painters.forEach((p) => p.measurePath());
  }

  Promise.all(painters.map((p) => p.ready()))
    .then(() => {
      measureAll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', measureAll);
      window.addEventListener('load', measureAll);
    })
    .catch(() => {
      measureAll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', measureAll);
    });

  function figmaSegmentIndex(hostEl) {
    if (!hostEl) return 0;
    for (const cls of hostEl.classList) {
      const match = cls.match(/^timeline-squiggle-host--figma-(\d+)$/);
      if (match) return parseInt(match[1], 10);
    }
    return 0;
  }

  function paintAfterSegmentNum(timelineEl) {
    const raw = timelineEl.getAttribute('data-squiggle-paint-after');
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  function scrollPaintPastFixedSegments(timelineEl, afterSegment) {
    if (!afterSegment) return true;
    const anchor = timelineEl.querySelector(
      `.timeline-squiggle-host--figma-${afterSegment}`
    );
    if (!anchor) return true;
    return window.innerHeight * 0.5 >= anchor.getBoundingClientRect().bottom - 8;
  }

  function createPainter(path, timelineEl) {
    const host = path.closest('.timeline-squiggle-host');
    const track = host ? host.querySelector('[data-squiggle-track]') : null;
    const pathSrc = path.getAttribute('data-squiggle-path-src');
    const svg = path.ownerSVGElement;
    const paintLinear =
      (host && host.classList.contains('timeline-squiggle-host--figma')) ||
      path.hasAttribute('data-squiggle-paint-linear');

    const paintAfter = paintAfterSegmentNum(timelineEl);
    const segmentIndex = figmaSegmentIndex(host);
    const alwaysVisible =
      paintAfter > 0 && segmentIndex > 0 && segmentIndex <= paintAfter;
    const deferredPaint = paintAfter > 0 && segmentIndex > paintAfter;

    const BRANCH_SWITCH_PX = 16;

    let pathLength = 0;
    let loopLenStart = 0;
    let loopLenEnd = 0;
    let activeBranch = 'before';
    let prevDrawn = 0;
    let prevScrollY = 0;

    function clamp(n, min, max) {
      return Math.min(max, Math.max(min, n));
    }

    function viewportCenterY() {
      return window.innerHeight * 0.5;
    }

    function pathPointScreenY(length) {
      const pt = path.getPointAtLength(length);
      const svgPt = svg.createSVGPoint();
      svgPt.x = pt.x;
      svgPt.y = pt.y;
      const ctm = path.getScreenCTM();
      if (!ctm) return 0;
      return svgPt.matrixTransform(ctm).y;
    }

    function detectLoopBounds() {
      loopLenStart = 0;
      loopLenEnd = 0;
      if (!pathLength || paintLinear) return;

      const steps = 400;
      let prev = path.getPointAtLength(0);
      let inLoop = false;
      let entryY = prev.y;

      for (let i = 1; i <= steps; i += 1) {
        const len = (i / steps) * pathLength;
        const pt = path.getPointAtLength(len);

        if (!inLoop && pt.y < prev.y - 0.8) {
          loopLenStart = Math.max(0, ((i - 2) / steps) * pathLength);
          inLoop = true;
          entryY = prev.y;
        }

        if (inLoop && pt.y >= entryY - 2 && len > loopLenStart + pathLength * 0.02) {
          loopLenEnd = Math.min(pathLength, len + pathLength * 0.015);
          break;
        }

        prev = pt;
      }

      if (inLoop && !loopLenEnd) {
        loopLenEnd = Math.min(pathLength, loopLenStart + pathLength * 0.08);
      }
    }

    function bestLengthInRange(lo, hi, branchName) {
      const target = viewportCenterY();
      const scrollingDown = window.scrollY >= prevScrollY - 0.5;
      const steps = branchName === 'loop' ? 180 : 90;
      const continuity = 0.07;
      const speed =
        parseFloat(timelineEl.getAttribute('data-squiggle-loop-speed')) || 2.4;
      const dirBias = branchName === 'loop' ? speed * 0.00007 : 0.000015;

      let bestLen = lo;
      let bestScore = Infinity;

      for (let i = 0; i <= steps; i += 1) {
        const len = lo + (i / steps) * (hi - lo);
        const dist = Math.abs(pathPointScreenY(len) - target);
        const score =
          dist +
          continuity * Math.abs(len - prevDrawn) -
          (scrollingDown ? len : -len) * dirBias;

        if (score < bestScore) {
          bestScore = score;
          bestLen = len;
        }
      }

      return { len: bestLen, dist: Math.abs(pathPointScreenY(bestLen) - target) };
    }

    function branchRanges() {
      if (loopLenEnd <= loopLenStart) {
        return [{ branch: 'full', lo: 0, hi: pathLength }];
      }
      return [
        { branch: 'before', lo: 0, hi: loopLenStart },
        { branch: 'loop', lo: loopLenStart, hi: loopLenEnd },
        { branch: 'after', lo: loopLenEnd, hi: pathLength },
      ];
    }

    function lengthAtViewportCenter() {
      const ranges = branchRanges();
      let winner = null;

      for (const range of ranges) {
        const { len, dist } = bestLengthInRange(
          range.lo,
          range.hi,
          range.branch === 'full' ? 'before' : range.branch
        );
        const penalty =
          range.branch === activeBranch || range.branch === 'full'
            ? 0
            : BRANCH_SWITCH_PX;
        const score = dist + penalty;

        if (!winner || score < winner.score) {
          winner = { branch: range.branch, len, score };
        }
      }

      if (winner && winner.branch !== 'full') {
        activeBranch = winner.branch;
      }

      return winner ? winner.len : 0;
    }

    function pathScreenYRange() {
      const samples = 24;
      let minY = Infinity;
      let maxY = -Infinity;
      for (let i = 0; i <= samples; i += 1) {
        const y = pathPointScreenY((i / samples) * pathLength);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      return { minY, maxY };
    }

    function getDrawnLength() {
      if (!pathLength) return 0;
      if (alwaysVisible) {
        prevDrawn = pathLength;
        return pathLength;
      }
      if (deferredPaint && !scrollPaintPastFixedSegments(timelineEl, paintAfter)) {
        prevDrawn = 0;
        return 0;
      }

      const target = viewportCenterY();
      const { minY, maxY } = pathScreenYRange();

      if (minY > target + 24) {
        prevDrawn = 0;
        return 0;
      }
      if (maxY < target - 24) {
        prevDrawn = pathLength;
        return pathLength;
      }

      const drawn = lengthAtViewportCenter();
      prevDrawn = drawn;
      prevScrollY = window.scrollY;
      return clamp(drawn, 0, pathLength);
    }

    function wantsStrokeTipFade() {
      return (
        window.matchMedia('(max-width: 700px)').matches &&
        !!document.getElementById('hero-principal') &&
        segmentIndex === 3 &&
        deferredPaint
      );
    }

    function applyStrokeTipFade() {
      if (!svg || !pathLength) return;

      const gradId = 'squiggle-tip-fade-figma-3';
      const svgNs = 'http://www.w3.org/2000/svg';
      const figmaFadeW = 61;
      const figmaFadeH = 545;

      if (!wantsStrokeTipFade()) {
        path.style.opacity = '';
        const stale = svg.querySelector('#' + gradId);
        if (stale) stale.remove();
        const stroke = path.getAttribute('stroke') || '';
        if (!stroke.includes('url(#') && !path.hasAttribute('data-squiggle-stroke-gradient')) {
          path.setAttribute('stroke', 'currentColor');
        }
        return;
      }

      const lineColor =
        getComputedStyle(svg).color ||
        getComputedStyle(path).color ||
        '#EDEDED';

      let defs = svg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS(svgNs, 'defs');
        svg.insertBefore(defs, svg.firstChild);
      }

      const stale = defs.querySelector('#' + gradId);
      if (stale) stale.remove();

      const vb = svg.viewBox.baseVal;
      const vx = vb.x || 0;
      const vy = vb.y || 0;
      const vw = vb.width || figmaFadeW;
      const vh = vb.height || figmaFadeH;
      const sx = vw / figmaFadeW;
      const sy = vh / figmaFadeH;

      const grad = document.createElementNS(svgNs, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      grad.setAttribute('x1', String(vx + 22 * sx));
      grad.setAttribute('y1', String(vy + 526.5 * sy));
      grad.setAttribute('x2', String(vx + 10.5 * sx));
      grad.setAttribute('y2', String(vy + 8.99998 * sy));
      [
        [0, lineColor, 1],
        [0.76572, lineColor, 1],
        [1, lineColor, 0],
      ].forEach(([offset, color, opacity]) => {
        const stop = document.createElementNS(svgNs, 'stop');
        stop.setAttribute('offset', String(offset));
        stop.setAttribute('stop-color', color);
        stop.setAttribute('stop-opacity', String(opacity));
        grad.appendChild(stop);
      });
      defs.appendChild(grad);

      path.setAttribute('stroke', 'url(#' + gradId + ')');
      path.style.opacity = '';
    }

    function applyScreenStroke() {
      const px = parseFloat(timelineEl.getAttribute('data-squiggle-stroke-px'));
      if (!px || !path.getScreenCTM) return;

      const ctm = path.getScreenCTM();
      if (!ctm) return;

      const scale = Math.hypot(ctm.a, ctm.b) || 1;
      const strokeUnits = px / scale;
      const sw = String(strokeUnits);

      path.setAttribute('stroke-width', sw);
      if (track) track.setAttribute('stroke-width', sw);
    }

    function measurePath() {
      pathLength = path.getTotalLength();
      detectLoopBounds();
      activeBranch = 'before';
      prevDrawn = 0;
      prevScrollY = window.scrollY;
      applyScreenStroke();
      applyStrokeTipFade();
      const dash = `${pathLength}`;
      path.style.strokeDasharray = dash;
      if (track) {
        track.style.strokeDasharray = dash;
        track.style.strokeDashoffset = '0';
      }
      updatePaint();
    }

    function updatePaint() {
      const drawn =
        reducedMotion || alwaysVisible
          ? pathLength
          : getDrawnLength();
      path.style.strokeDashoffset = String(pathLength - drawn);
    }

    function applyPathData(d) {
      path.setAttribute('d', d);
      if (track) track.setAttribute('d', d);
    }

    function parsePathPayload(text) {
      const raw = text.trim();
      if (!raw.startsWith('<')) {
        return { d: raw, viewBox: null };
      }
      const doc = new DOMParser().parseFromString(raw, 'image/svg+xml');
      const pathEl = doc.querySelector('path');
      if (!pathEl) {
        return { d: raw, viewBox: null };
      }
      const d = pathEl.getAttribute('d');
      const svgEl = doc.querySelector('svg');
      const viewBox = svgEl ? svgEl.getAttribute('viewBox') : null;
      return { d: d || raw, viewBox };
    }

    function applyViewBox(viewBox) {
      if (!viewBox || !svg) return;
      svg.setAttribute('viewBox', viewBox);
    }

    function hasInlinePath() {
      const d = path.getAttribute('d');
      return Boolean(d && d.trim().length > 20);
    }

    function loadPathSrc(src) {
      return fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error('fetch failed');
          return res.text();
        })
        .then((text) => {
          const { d, viewBox } = parsePathPayload(text);
          if (!d || d.trim().length < 20) throw new Error('empty path');
          applyPathData(d);
          applyViewBox(viewBox);
        });
    }

    const fallbackSrcs = [
      '/img/Vector-261.svg',
      '/img/squiggle-v3-path.txt',
      '../img/Vector-261.svg',
      '../img/squiggle-v3-path.txt',
      '../img/Vector%20261.svg',
    ];

    function tryLoadPathSources() {
      const sources = [pathSrc].concat(fallbackSrcs).filter(Boolean);
      let chain = Promise.reject();
      sources.forEach((src) => {
        chain = chain.catch(() => loadPathSrc(src));
      });
      return chain;
    }

    function ready() {
      if (hasInlinePath()) {
        return Promise.resolve();
      }
      return tryLoadPathSources().catch(() => {
        console.warn('[squiggle] Could not load path for', pathSrc || 'inline');
      });
    }

    return { ready, measurePath, updatePaint };
  }
})();
