/**
 * Hit regions for mobile-home-nav.svg (viewBox 0 0 370 313).
 * Percentages from glyph row bands; case-study hrefs match index.html.
 */
(function () {
  var LINKS = [
    { top: 20.5, left: 0, width: 34, height: 16, href: 'projects/nespresso-page.html', label: 'NESPRESSO', group: 'nespresso' },
    { top: 20.5, left: 34, width: 32, height: 16, href: 'projects/pageone.html', label: 'CHRISTIES', group: 'christies' },
    { top: 20.5, left: 66, width: 34, height: 16, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },

    { top: 38, left: 0, width: 25, height: 12.5, href: '#', label: 'FARFETCH' },
    { top: 38, left: 25, width: 25, height: 12.5, href: '#', label: 'OBODO' },
    { top: 38, left: 50, width: 28, height: 12.5, href: '#', label: 'NET-A-PORTER' },
    { top: 38, left: 78, width: 22, height: 12.5, href: 'projects/wagamama-page.html', label: 'WAGAMAMA' },

    { top: 52.5, left: 0, width: 48, height: 9, href: '#', label: 'DOWNLOAD MY CV', group: 'cv' },
    { top: 52.5, left: 48, width: 52, height: 9, href: '#', label: 'READ TESTIMONIALS', group: 'testimonials' },

    { top: 64, left: 0, width: 100, height: 9, href: 'mailto:samdemmyhardy@gmail.com', label: 'EMAIL ME', group: 'email' }
  ];

  function resolveHref(href) {
    if (!href || href.charAt(0) === '#' || href.indexOf('mailto:') === 0) return href;
    if (!document.getElementById('hero-principal')) return href;
    if (href.indexOf('projects/') === 0) return href.slice('projects/'.length);
    return href;
  }

  function buildLinkOverlay(host) {
    var nav = document.createElement('nav');
    nav.className = 'mht-nav-links';
    nav.setAttribute('aria-label', 'Mobile home navigation links');

    LINKS.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'mht-nav-hit';
      a.href = resolveHref(item.href);
      a.setAttribute('aria-label', item.label);
      a.style.top = item.top + '%';
      a.style.left = item.left + '%';
      a.style.width = item.width + '%';
      a.style.height = item.height + '%';
      if (item.group) a.setAttribute('data-hover-group', item.group);
      nav.appendChild(a);
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
