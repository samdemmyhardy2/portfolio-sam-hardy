/**
 * Process reveal — expands the collapsed timeline when the button is clicked.
 * rAF height animation (1100ms, ease-in) for steadier frame pacing than CSS
 * height transitions on a large layout-heavy section.
 */
(function () {
  const timeline = document.querySelector('.timeline--collapsed');
  const fade = document.querySelector('[data-process-fade]');
  const btn = document.querySelector('[data-process-reveal]');
  if (!timeline || !fade || !btn) return;

  const HEIGHT_DURATION_MS = 1100;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Matches cubic-bezier(0.45, 0, 0.8, 0.1) — slow start, fast finish */
  function easeInReveal(t) {
    return t * t * (3 - 2 * t);
  }

  function finish() {
    timeline.classList.remove('timeline--collapsed', 'timeline--revealing');
    timeline.style.height = '';
    timeline.style.willChange = '';
    document.documentElement.classList.remove('timeline-revealing');
    fade.remove();
    window.dispatchEvent(new Event('resize'));
  }

  function animateHeight(from, to, onDone) {
    timeline.classList.add('timeline--revealing');
    document.documentElement.classList.add('timeline-revealing');
    const start = performance.now();

    function frame(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / HEIGHT_DURATION_MS);
      const h = from + (to - from) * easeInReveal(t);
      timeline.style.height = h + 'px';

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        onDone();
      }
    }

    requestAnimationFrame(frame);
  }

  btn.addEventListener(
    'click',
    () => {
      fade.classList.add('is-hidden');

      if (reducedMotion) {
        finish();
        return;
      }

      const cssTarget = parseFloat(
        getComputedStyle(timeline).getPropertyValue('--timeline-full-height')
      );
      const target = Number.isFinite(cssTarget) ? cssTarget : timeline.scrollHeight;
      const from = timeline.getBoundingClientRect().height;

      animateHeight(from, target, finish);
    },
    { once: true }
  );
})();
