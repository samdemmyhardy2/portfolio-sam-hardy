/**
 * Hit regions for mobile-home-nav.svg (viewBox 0 0 13741 10450).
 * Percentages from Figma glyph bands; hrefs match index.html hero rows.
 */
(function () {
  var HOME_LINK = {
    top: 0,
    left: 0,
    width: 55,
    height: 17,
    href: 'index.html',
    label: 'SAM HARDY — LEAD PRODUCT DESIGNER',
    z: 1,
  };

  var LINKS = [
    /* Row 2 — DESIGNER / HIRE ME / ABOUT ME (y ~16–29%) */
    { top: 16.3, left: 0, width: 36, height: 13, href: 'index.html', label: 'DESIGNER', group: 'designer' },
    { top: 16.3, left: 36, width: 24, height: 13, href: '#', label: 'HIRE ME', group: 'hire-me' },
    { top: 16.3, left: 60, width: 40, height: 13, href: '#', label: 'ABOUT ME', group: 'about-me' },

    /* Main project row — shifted down to match the actual rendered mobile SVG */
    { top: 45.3, left: 0, width: 44, height: 13.5, href: 'projects/nespresso-page.html', label: 'NESPRESSO', group: 'nespresso' },
    { top: 45.3, left: 44, width: 27, height: 13.5, href: 'projects/pageone.html', label: 'CHRISTIES', group: 'christies' },
    { top: 45.3, left: 71, width: 29, height: 13.5, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },

    /* Brand row */
    { top: 60.5, left: 0, width: 14, height: 11.5, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },
    { top: 60.5, left: 30, width: 18, height: 11.5, href: '#', label: 'FARFETCH' },
    { top: 60.5, left: 48, width: 10, height: 11.5, href: '#', label: 'OBODO' },
    { top: 60.5, left: 58, width: 22, height: 11.5, href: '#', label: 'NET-A-PORTER' },
    { top: 60.5, left: 80, width: 20, height: 11.5, href: 'projects/wagamama-page.html', label: 'WAGAMAMA' },

    { top: 76.5, left: 0, width: 46, height: 10, href: '#', label: 'DOWNLOAD MY CV', group: 'cv' },
    { top: 76.5, left: 46, width: 54, height: 10, href: '#', label: 'READ TESTIMONIALS', group: 'testimonials' },

    { top: 86.5, left: 0, width: 100, height: 10, href: 'mailto:samdemmyhardy@gmail.com', label: 'EMAIL ME', group: 'email' }
  ];

  function resolveHomeHref() {
    if (document.getElementById('hero-home')) return '#hero-home';
    if (document.getElementById('hero-principal')) return '../index.html';
    return 'index.html';
  }

  function resolveHref(href) {
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return href;
    if (href === 'index.html' || href === '/') return resolveHomeHref();
    if (!document.getElementById('hero-principal')) return href;
    if (href.indexOf('projects/') === 0) return href.slice('projects/'.length);
    return href;
  }

  function appendHit(nav, item) {
    var a = document.createElement('a');
    a.className = 'mht-nav-hit hero-link-small lit';
    a.href = resolveHref(item.href);
    a.setAttribute('aria-label', item.label);
    a.textContent = item.label;
    a.style.top = item.top + '%';
    a.style.left = item.left + '%';
    a.style.width = item.width + '%';
    a.style.height = item.height + '%';
    a.style.zIndex = String(item.z || 2);
    a.setAttribute('data-nav-label', item.label);
    if (item.group) a.setAttribute('data-hover-group', item.group);
    function handleTap(e) {
      var href = a.getAttribute('href');
      if (!href || href === '#' || href.charAt(0) === '#') {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      window.location.href = a.href;
    }
    a.addEventListener('click', handleTap);
    a.addEventListener('pointerup', handleTap);
    a.addEventListener('touchend', handleTap, { passive: false });
    nav.appendChild(a);
    return a;
  }

  function buildLinkOverlay(host) {
    var existing = host.querySelector('.mht-nav-links');
    if (existing) existing.remove();

    var nav = document.createElement('nav');
    nav.className = 'mht-nav-links';
    nav.setAttribute('aria-label', 'Mobile home navigation links');

    var isCaseHeader = !!host.closest('.case-mobile-header-nav');
    var headerLinks = [
      { top: 1.5, left: 0, width: 44, height: 24.8, href: 'projects/nespresso-page.html', label: 'NESPRESSO', group: 'nespresso' },
      { top: 1.5, left: 44, width: 27, height: 24.8, href: 'projects/pageone.html', label: 'CHRISTIES', group: 'christies' },
      { top: 1.5, left: 71, width: 29, height: 24.8, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },
      { top: 29.4, left: 0, width: 14, height: 21.1, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },
      { top: 29.4, left: 30, width: 18, height: 21.1, href: '#', label: 'FARFETCH' },
      { top: 29.4, left: 48, width: 10, height: 21.1, href: '#', label: 'OBODO' },
      { top: 29.4, left: 58, width: 22, height: 21.1, href: '#', label: 'NET-A-PORTER' },
      { top: 29.4, left: 80, width: 20, height: 21.1, href: 'projects/wagamama-page.html', label: 'WAGAMAMA' },
      { top: 58.7, left: 0, width: 46, height: 18.3, href: '#', label: 'DOWNLOAD MY CV', group: 'cv' },
      { top: 58.7, left: 46, width: 54, height: 18.3, href: '#', label: 'READ TESTIMONIALS', group: 'testimonials' },
      { top: 77.1, left: 0, width: 100, height: 18.3, href: 'mailto:samdemmyhardy@gmail.com', label: 'EMAIL ME', group: 'email' }
    ];

    if (!isCaseHeader) appendHit(nav, HOME_LINK);
    (isCaseHeader ? headerLinks : LINKS).forEach(function (item) {
      appendHit(nav, item);
    });

    host.appendChild(nav);
    wireHoverGroups(host);
  }

  function wireHoverGroups(host) {
    var links = host.querySelectorAll('.mht-nav-hit[data-hover-group]');
    links.forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        var g = link.getAttribute('data-hover-group');
        host.querySelectorAll('.mht-nav-hit[data-hover-group="' + g + '"]').forEach(function (el) {
          el.classList.add('mht-nav-hit--lit');
        });
      });
      link.addEventListener('mouseleave', function () {
        var g = link.getAttribute('data-hover-group');
        host.querySelectorAll('.mht-nav-hit[data-hover-group="' + g + '"]').forEach(function (el) {
          el.classList.remove('mht-nav-hit--lit');
        });
      });
    });
  }

  window.mhtBuildLinkOverlay = buildLinkOverlay;
})();
