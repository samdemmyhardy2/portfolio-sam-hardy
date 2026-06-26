/**
 * Load composite mobile home SVG + link overlay into #hero-mobile-nav-art
 * (home) or #mht-nav-art (test page).
 */
(function () {
  function svgUrl() {
    var base;
    if (document.getElementById('case-mobile-footer-nav-art')) {
      base = '../img/mobile-home-test/mobile-home-nav.svg';
    } else {
      base = 'img/mobile-home-test/mobile-home-nav.svg';
    }
    return base + '?v=11';
  }

  function getHosts() {
    var hosts = [];
    var homeArt = document.getElementById('hero-mobile-nav-art');
    var homeHost = document.getElementById('hero-mobile-svg-host');
    if (homeArt && homeHost) hosts.push({ wrap: homeArt, svgHost: homeHost });

    var caseHeaderArt = document.getElementById('case-mobile-header-nav-art');
    var caseHeaderHost = document.getElementById('case-mobile-header-svg-host');
    if (caseHeaderArt && caseHeaderHost) {
      hosts.push({ wrap: caseHeaderArt, svgHost: caseHeaderHost });
    }

    var testArt = document.getElementById('mht-nav-art');
    var testHost = document.getElementById('mht-nav-svg-host');
    if (testArt && testHost && testArt !== homeArt) hosts.push({ wrap: testArt, svgHost: testHost });

    var footerArt = document.getElementById('case-mobile-footer-nav-art');
    var footerHost = document.getElementById('case-mobile-footer-svg-host');
    if (footerArt && footerHost) hosts.push({ wrap: footerArt, svgHost: footerHost });

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

    fetch(svgUrl())
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
