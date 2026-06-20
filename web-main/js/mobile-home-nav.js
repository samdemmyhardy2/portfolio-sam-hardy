/**
 * Load composite mobile home SVG + link overlay into #hero-mobile-nav-art
 * (home) or #mht-nav-art (test page).
 */
(function () {
  function getHosts() {
    var hosts = [];
    var homeArt = document.getElementById('hero-mobile-nav-art');
    var homeHost = document.getElementById('hero-mobile-svg-host');
    if (homeArt && homeHost) hosts.push({ wrap: homeArt, svgHost: homeHost });

    var testArt = document.getElementById('mht-nav-art');
    var testHost = document.getElementById('mht-nav-svg-host');
    if (testArt && testHost && testArt !== homeArt) hosts.push({ wrap: testArt, svgHost: testHost });

    return hosts;
  }

  function mountSvg(wrap, svgHost, svgText) {
    svgHost.innerHTML = svgText;
    var el = svgHost.querySelector('svg');
    if (el) {
      el.classList.add('mht-nav-svg');
      el.setAttribute('aria-hidden', 'true');
    }
    if (window.mhtBuildLinkOverlay) window.mhtBuildLinkOverlay(wrap);
  }

  function init() {
    var hosts = getHosts();
    if (!hosts.length) return;

    fetch('img/mobile-home-test/mobile-home-nav.svg')
      .then(function (r) { return r.text(); })
      .then(function (svg) {
        hosts.forEach(function (h) { mountSvg(h.wrap, h.svgHost, svg); });
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
