/**
 * Case-study mobile header — 3 rows at #hero-principal (below 680px).
 * Row 1: NESPRESSO / OBODO.IO
 * Row 2: CHRISTIES AUCTION HOUSE
 * Row 3: WAGAMAMA / NET-A-PORTER / FARFETCH
 */
(function () {
  var ROWS = [
    {
      className: 'hero-mobile-case-row--principal',
      linkClass: 'hero-link-big',
      items: [
        { href: 'nespresso-page.html', svg: '../img/hero/nespresso.svg', vb: 558, label: 'NESPRESSO', group: 'nespresso', active: 'nespresso' },
        { slash: true },
        { href: '#', svg: '../img/hero/obodo.svg', vb: 228, label: 'OBODO.IO', active: 'obodo' }
      ]
    },
    {
      className: 'hero-mobile-case-row--principal',
      linkClass: 'hero-link-big',
      items: [
        { href: 'pageone.html', svg: '../img/hero/christies.svg', vb: 453, label: 'CHRISTIES', group: 'christies', active: 'christies' },
        { href: 'pageone.html', svg: '../img/hero/auction.svg', vb: 382, label: 'AUCTION', group: 'christies', active: 'christies' },
        { href: 'pageone.html', svg: '../img/hero/house.svg', vb: 287, label: 'HOUSE', group: 'christies', active: 'christies' }
      ]
    },
    {
      className: 'hero-mobile-case-row--brands',
      linkClass: 'hero-link-small',
      items: [
        { href: 'wagamama-page.html', svg: '../img/hero/wagamama-word.svg', vb: 380, label: 'WAGAMAMA', active: 'wagamama' },
        { slash: true },
        { href: '#', svg: '../img/hero/net-a-porter.svg', vb: 462, label: 'NET-A-PORTER' },
        { slash: true },
        { href: '#', svg: '../img/hero/farfetch.svg', vb: 328, label: 'FARFETCH' }
      ]
    }
  ];

  function buildCaseNav(activeKey) {
    var nav = document.createElement('div');
    nav.className = 'hero-mobile-case-nav';
    nav.id = 'hero-mobile-case-nav';

    ROWS.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'hero-mobile-case-row ' + row.className;

      row.items.forEach(function (item) {
        if (item.slash) {
          var slash = document.createElement('span');
          slash.className = 'hero-mobile-case-slash';
          slash.setAttribute('aria-hidden', 'true');
          slash.textContent = '/';
          rowEl.appendChild(slash);
          return;
        }

        var a = document.createElement('a');
        a.href = item.href;
        a.className = row.linkClass;
        a.setAttribute('aria-label', item.label);
        if (item.group) a.setAttribute('data-hover-group', item.group);
        if (item.active && item.active === activeKey) a.classList.add('hero-active');

        var span = document.createElement('span');
        span.className = 'ru hero-vector-reveal';
        span.setAttribute('data-hero-svg', item.svg);
        span.setAttribute('data-vb-width', String(item.vb));
        a.style.flex = item.vb + ' 1 0';
        a.appendChild(span);
        rowEl.appendChild(a);
      });

      nav.appendChild(rowEl);
    });

    return nav;
  }

  function init() {
    var principal = document.getElementById('hero-principal');
    if (!principal || principal.querySelector('.hero-mobile-case-nav')) return;

    var activeKey = principal.getAttribute('data-mobile-case-active') || '';
    principal.appendChild(buildCaseNav(activeKey));
  }

  init();
})();
