/**
 * Squiggle scroll paint — paint head stays at viewport centre.
 * Path split into before / loop / after branches; pick closest-to-centre
 * per branch, switch branch only when clearly better (stops loop flicker).
 */
(function () {
  const timeline = document.querySelector('[data-squiggle-timeline]');
  const path = document.querySelector('[data-squiggle-path]');
  if (!timeline || !path) return;

  const track = document.querySelector('[data-squiggle-track]');
  const pathSrc = path.getAttribute('data-squiggle-path-src');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const svg = path.ownerSVGElement;

  const BRANCH_SWITCH_PX = 16;

  let pathLength = 0;
  let loopLenStart = 0;
  let loopLenEnd = 0;
  let activeBranch = 'before';
  let prevDrawn = 0;
  let prevScrollY = 0;
  let ticking = false;

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
    if (!pathLength) return;

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

  /**
   * Best length in [lo, hi] for paint head at viewport centre.
   * Continuity + slight scroll bias in loop (fast but still near centre).
   */
  function bestLengthInRange(lo, hi, branchName) {
    const target = viewportCenterY();
    const scrollingDown = window.scrollY >= prevScrollY - 0.5;
    const steps = branchName === 'loop' ? 180 : 90;
    const continuity = 0.07;
    const speed =
      parseFloat(timeline.getAttribute('data-squiggle-loop-speed')) || 2.4;
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

  function measurePath() {
    pathLength = path.getTotalLength();
    detectLoopBounds();
    activeBranch = 'before';
    prevDrawn = 0;
    prevScrollY = window.scrollY;
    const dash = `${pathLength}`;
    path.style.strokeDasharray = dash;
    if (track) {
      track.style.strokeDasharray = dash;
      track.style.strokeDashoffset = '0';
    }
    updatePaint();
  }

  function updatePaint() {
    const drawn = reducedMotion ? pathLength : getDrawnLength();
    path.style.strokeDashoffset = String(pathLength - drawn);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updatePaint();
      ticking = false;
    });
  }

  function bind() {
    measurePath();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measurePath);
    window.addEventListener('load', measurePath);
  }

  function applyPathData(d) {
    path.setAttribute('d', d);
    if (track) track.setAttribute('d', d);
  }

  if (pathSrc) {
    fetch(pathSrc)
      .then((res) => res.text())
      .then((text) => {
        applyPathData(text.trim());
        bind();
      })
      .catch(() => {
        bind();
      });
  } else {
    bind();
  }
})();
