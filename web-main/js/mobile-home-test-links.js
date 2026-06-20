/**
 * Hit regions for mobile-home-nav.svg (viewBox 0 0 364 202).
 * Percentages derived from path y-band gaps; case-study hrefs match index.html.
 */
(function () {
  var LINKS = [
    { top: 35.9, left: 0, width: 34, height: 34.1, href: 'projects/nespresso-page.html', label: 'NESPRESSO', group: 'nespresso' },
    { top: 35.9, left: 34, width: 26, height: 34.1, href: 'projects/pageone.html', label: 'CHRISTIES', group: 'christies' },
    { top: 35.9, left: 60, width: 20, height: 34.1, href: 'projects/pageone.html', label: 'AUCTION', group: 'christies' },
    { top: 35.9, left: 80, width: 20, height: 34.1, href: 'projects/pageone.html', label: 'HOUSE', group: 'christies' },

    { top: 70, left: 0, width: 20, height: 11, href: 'projects/givenchy-page.html', label: 'GIVENCHY' },
    { top: 70, left: 20, width: 20, height: 11, href: '#', label: 'FARFETCH' },
    { top: 70, left: 40, width: 18, height: 11, href: '#', label: 'OBODO' },
    { top: 70, left: 58, width: 24, height: 11, href: '#', label: 'NET-A-PORTER' },
    { top: 70, left: 82, width: 18, height: 11, href: 'projects/wagamama-page.html', label: 'WAGAMAMA' },

    { top: 81, left: 0, width: 48, height: 11.1, href: '#', label: 'DOWNLOAD MY CV', group: 'cv' },
    { top: 81, left: 48, width: 52, height: 11.1, href: '#', label: 'READ TESTIMONIALS', group: 'testimonials' },

    { top: 92.1, left: 0, width: 100, height: 7.9, href: 'mailto:samdemmyhardy@gmail.com', label: 'EMAIL ME', group: 'email' }
  ];

  function buildLinkOverlay(host) {
    var nav = document.createElement('nav');
    nav.className = 'mht-nav-links';
    nav.setAttribute('aria-label', 'Mobile home navigation links');

    LINKS.forEach(function (item) {
      var a = document.createElement('a');
      a.className = 'mht-nav-hit';
      a.href = item.href;
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
