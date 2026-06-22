/**
 * Case-study mobile header — composite Figma SVG (364×169), below 680px.
 * Same pattern as mobile-home-nav.js.
 */
(function () {
  var SVG_URL = '../img/mobile-case-nav/mobile-case-nav.svg';

  /* Hit regions (% of viewBox 364×169) — tune against Figma composite */
  var LINKS = [
    { top: 0, left: 0, width: 58, height: 24, href: 'nespresso-page.html', label: 'NESPRESSO', active: 'nespresso' },
    { top: 0, left: 58, width: 42, height: 24, href: '#', label: 'OBODO' },

    { top: 25.5, left: 0, width: 38, height: 22, href: 'pageone.html', label: 'CHRISTIES', group: 'christies', active: 'christies' },
    { top: 25.5, left: 38, width: 30, height: 22, href: 'pageone.html', label: 'AUCTION', group: 'christies', active: 'christies' },
    { top: 25.5, left: 68, width: 32, height: 22, href: 'pageone.html', label: 'HOUSE', group: 'christies', active: 'christies' },

    { top: 49, left: 0, width: 28, height: 20, href: 'wagamama-page.html', label: 'WAGAMAMA', active: 'wagamama' },
    { top: 49, left: 28, width: 16, height: 20, href: '#', label: 'OBODO' },
    { top: 49, left: 44, width: 22, height: 20, href: '#', label: 'FARFETCH' },
    { top: 49, left: 66, width: 34, height: 20, href: '#', label: 'NET-A-PORTER' },

    { top: 70, left: 0, width: 55, height: 18, href: '#', label: 'NET-A-PORTER' },
    { top: 70, left: 55, width: 45, height: 18, href: '#', label: 'FARFETCH' },

    { top: 88, left: 0, width: 100, height: 12, href: 'givenchy-page.html', label: 'GIVENCHY', active: 'givenchy' }
  ];

  function buildLinkOverlay(host, activeKey) {
    var nav = document.createElement('nav');
    nav.className = 'mcn-nav-links';
    nav.setAttribute('aria-label', 'Case study navigation links');

    LINKS.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'mcn-nav-hit';
      a.href = item.href;
      a.setAttribute('aria-label', item.label);
      a.style.top = item.top + '%';
      a.style.left = item.left + '%';
      a.style.width = item.width + '%';
      a.style.height = item.height + '%';
      if (item.group) a.setAttribute('data-hover-group', item.group);
      if (item.active && item.active === activeKey) a.classList.add('mcn-nav-hit--active');
      nav.appendChild(a);
    });

    host.appendChild(nav);
    wireHoverGroups(host);
  }

  function wireHoverGroups(host) {
    host.querySelectorAll('.mcn-nav-hit[data-hover-group]').forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        var g = link.getAttribute('data-hover-group');
        host.querySelectorAll('.mcn-nav-hit[data-hover-group="' + g + '"]').forEach(function (el) {
          el.classList.add('mcn-nav-hit--lit');
        });
      });
      link.addEventListener('mouseleave', function () {
        var g = link.getAttribute('data-hover-group');
        host.querySelectorAll('.mcn-nav-hit[data-hover-group="' + g + '"]').forEach(function (el) {
          el.classList.remove('mcn-nav-hit--lit');
        });
      });
    });
  }

  function mountNav(principal, activeKey) {
    var wrap = document.createElement('div');
    wrap.className = 'hero-mobile-case-nav';
    wrap.id = 'hero-mobile-case-nav';

    var art = document.createElement('div');
    art.className = 'mcn-nav-art';

    var svgHost = document.createElement('div');
    svgHost.className = 'mcn-nav-svg-host';
    art.appendChild(svgHost);

    wrap.appendChild(art);
    principal.appendChild(wrap);

    fetch(SVG_URL)
      .then(function (r) { return r.text(); })
      .then(function (svg) {
        svgHost.innerHTML = svg;
        var el = svgHost.querySelector('svg');
        if (el) {
          el.classList.add('mcn-nav-svg');
          el.setAttribute('aria-hidden', 'true');
        }
        buildLinkOverlay(art, activeKey);
      });
  }

  function init() {
    var principal = document.getElementById('hero-principal');
    if (!principal || principal.querySelector('.hero-mobile-case-nav')) return;

    var activeKey = principal.getAttribute('data-mobile-case-active') || '';
    mountNav(principal, activeKey);
  }

  init();
})();
